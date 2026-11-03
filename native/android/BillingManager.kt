package uz.nikbozor.billing

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONObject

// ---------- Domain ----------

enum class Tier { FREE, PRO }

enum class ProductId(val sku: String) { MONTHLY("monthly"), YEARLY("yearly"), LIFETIME("lifetime"), COINS_100("coins_100"), COINS_500("coins_500") }

data class StoreProduct(val id: ProductId, val price: String, val badge: String? = null, val coins: Int? = null)

data class Entitlements(
    val tier: Tier = Tier.FREE,
    val expiresAt: Long? = null,          // epoch millis; null for lifetime/free
    val coins: Int = 0,
    val unlocked: Set<String> = emptySet(),
    val boosts: Map<String, Long> = emptyMap(), // itemId -> expiry millis
)

enum class PurchaseResult { SUCCESS, CANCELLED, PENDING, FAILED }

/** Single source of truth for pricing rules (mirrors lib/billing.ts PRICING). */
object Pricing {
    val commission = mapOf(Tier.FREE to 0.05, Tier.PRO to 0.02)
    const val UNLOCK_COST = 20
    const val BOOST_COST = 50
    const val BOOST_HOURS = 24
    const val PROMOTED_SLOTS = 2
}

sealed interface PaywallReason {
    data class Unlock(val itemId: String) : PaywallReason
    data class Boost(val itemId: String) : PaywallReason
    data object Upgrade : PaywallReason
    data object Coins : PaywallReason
}

// ---------- Provider adapter: Google Play Billing / Payme / Click plug in here ----------

interface BillingProvider {
    suspend fun products(): List<StoreProduct>
    suspend fun purchase(id: ProductId): PurchaseResult
    suspend fun restore(): Entitlements?
}

class DemoBillingProvider : BillingProvider {
    override suspend fun products() = listOf(
        StoreProduct(ProductId.MONTHLY, "$4.99"),
        StoreProduct(ProductId.YEARLY, "$35.99", badge = "−40%"),
        StoreProduct(ProductId.LIFETIME, "$89"),
        StoreProduct(ProductId.COINS_100, "$1.99", coins = 100),
        StoreProduct(ProductId.COINS_500, "$7.99", coins = 500),
    )
    override suspend fun purchase(id: ProductId): PurchaseResult { delay(700); return PurchaseResult.SUCCESS }
    override suspend fun restore(): Entitlements? = null
}

/*
 Google Play Billing adapter sketch (own file, no Compose imports):

 class PlayBillingProvider(private val client: BillingClient) : BillingProvider {
     override suspend fun products(): List<StoreProduct> {
         val params = QueryProductDetailsParams.newBuilder().setProductList(ProductId.entries.map {
             QueryProductDetailsParams.Product.newBuilder().setProductId(it.sku)
                 .setProductType(if (it.coins == null) ProductType.SUBS else ProductType.INAPP).build()
         }).build()
         return client.queryProductDetails(params).productDetailsList.orEmpty().map { d ->
             StoreProduct(ProductId.entries.first { it.sku == d.productId },
                 d.oneTimePurchaseOfferDetails?.formattedPrice ?: d.subscriptionOfferDetails!!.first().pricingPhases.pricingPhaseList.first().formattedPrice)
         }
     }
     override suspend fun purchase(id: ProductId): PurchaseResult = /* launchBillingFlow + PurchasesUpdatedListener → map */ PurchaseResult.PENDING
     override suspend fun restore(): Entitlements? = /* queryPurchasesAsync(SUBS + INAPP) → Entitlements */ null
 }
*/

// ---------- MonetizationViewModel ----------

class BillingManager(
    private var provider: BillingProvider = DemoBillingProvider(),
    private val prefs: android.content.SharedPreferences? = null,
) : ViewModel() {

    private val _entitlements = MutableStateFlow(load())
    val entitlements: StateFlow<Entitlements> = _entitlements

    var products by mutableStateOf<List<StoreProduct>>(emptyList()); private set
    var busy by mutableStateOf(false); private set
    var paywall by mutableStateOf<PaywallReason?>(null)

    /** Swap the store adapter at startup; views never change. */
    fun use(p: BillingProvider) { provider = p }

    // Derived state read by composables
    val isPro: Boolean get() = _entitlements.value.let { it.tier == Tier.PRO && (it.expiresAt == null || it.expiresAt > now()) }
    fun canSee(itemId: String, premium: Boolean) = !premium || isPro || itemId in _entitlements.value.unlocked
    fun isBoosted(itemId: String) = (_entitlements.value.boosts[itemId] ?: 0L) > now()
    fun commissionFor(uzs: Long): Long = Math.round(uzs * Pricing.commission.getValue(if (isPro) Tier.PRO else Tier.FREE))

    // Intents
    fun load() = viewModelScope.launch { products = runCatching { provider.products() }.getOrDefault(emptyList()) }

    fun purchase(id: ProductId, onDone: (PurchaseResult) -> Unit = {}) = viewModelScope.launch {
        busy = true
        val result = runCatching { provider.purchase(id) }.getOrDefault(PurchaseResult.FAILED)
        if (result == PurchaseResult.SUCCESS) {
            val coins = products.firstOrNull { it.id == id }?.coins
            _entitlements.update { e ->
                if (coins != null) e.copy(coins = e.coins + coins)
                else e.copy(
                    tier = Tier.PRO,
                    expiresAt = when (id) { ProductId.MONTHLY -> now() + 30L * DAY; ProductId.YEARLY -> now() + 365L * DAY; else -> null },
                )
            }
            persist()
        }
        busy = false
        onDone(result)
    }

    fun unlock(itemId: String): Boolean {
        val e = _entitlements.value
        if (e.coins < Pricing.UNLOCK_COST) return false
        _entitlements.value = e.copy(coins = e.coins - Pricing.UNLOCK_COST, unlocked = e.unlocked + itemId)
        persist(); return true
    }

    fun boost(itemId: String): Boolean {
        val e = _entitlements.value
        if (e.coins < Pricing.BOOST_COST) return false
        _entitlements.value = e.copy(coins = e.coins - Pricing.BOOST_COST, boosts = e.boosts + (itemId to now() + Pricing.BOOST_HOURS * HOUR))
        persist(); return true
    }

    fun restore() = viewModelScope.launch { provider.restore()?.let { _entitlements.value = it; persist() } }

    // ---- persistence (SharedPreferences; swap for DataStore if preferred) ----
    private fun load(): Entitlements {
        val raw = prefs?.getString(KEY, null) ?: return Entitlements()
        val j = JSONObject(raw)
        return Entitlements(
            tier = Tier.valueOf(j.optString("tier", "FREE")),
            expiresAt = j.optLong("expiresAt").takeIf { j.has("expiresAt") },
            coins = j.optInt("coins"),
            unlocked = j.optJSONArray("unlocked")?.let { a -> (0 until a.length()).map { a.getString(it) }.toSet() } ?: emptySet(),
            boosts = j.optJSONObject("boosts")?.let { b -> b.keys().asSequence().associateWith { b.getLong(it) } } ?: emptyMap(),
        )
    }
    private fun persist() {
        val e = _entitlements.value
        val j = JSONObject().put("tier", e.tier.name).put("coins", e.coins)
            .put("unlocked", org.json.JSONArray(e.unlocked.toList())).put("boosts", JSONObject(e.boosts))
        e.expiresAt?.let { j.put("expiresAt", it) }
        prefs?.edit()?.putString(KEY, j.toString())?.apply()
    }

    private fun now() = System.currentTimeMillis()
    companion object { const val KEY = "nikbozor.billing"; const val HOUR = 3_600_000L; const val DAY = 86_400_000L
        fun prefs(ctx: Context) = ctx.getSharedPreferences("nikbozor", Context.MODE_PRIVATE) }
}
