package uz.nikbozor.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.snapping.rememberSnapFlingBehavior
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.nikbozor.billing.BillingManager
import uz.nikbozor.billing.PaywallReason
import uz.nikbozor.billing.Pricing

// ---------- UI model ----------

enum class Kind { PHONE, TELEGRAM, INSTAGRAM }
data class Listing(
    val id: String, val kind: Kind, val value: String, val category: String,
    val priceUSD: Int, val priceUZS: Long, val rating: Double,
    val premium: Boolean = false, val sponsored: Boolean = false, val mine: Boolean = false,
)

/** Ordering lives in the view-model, composables are stateless. */
class FeedViewModel(private val billing: BillingManager) {
    var items by mutableStateOf<List<Listing>>(emptyList())

    val productRow: List<Listing>
        get() {
            val promoted = items.filter { billing.isBoosted(it.id) || it.sponsored }.take(Pricing.PROMOTED_SLOTS)
            val ids = promoted.map { it.id }.toSet()
            return promoted + items.filterNot { it.id in ids }.take(24)
        }

    fun promotion(index: Int, item: Listing): String? =
        if (index >= Pricing.PROMOTED_SLOTS) null else if (billing.isBoosted(item.id)) "BOOSTED" else if (item.sponsored) "AD" else null
}

/** Visible fraction of a lazy item → 1 / 0.45 / 0 bands (same thresholds as web). */
fun LazyListLayoutInfo.visibilityOf(key: Any): Float {
    val info = visibleItemsInfo.firstOrNull { it.key == key } ?: return 0f
    val start = viewportStartOffset; val end = viewportEndOffset
    val visible = (minOf(info.offset + info.size, end) - maxOf(info.offset, start)).coerceAtLeast(0)
    val ratio = visible.toFloat() / info.size.coerceAtLeast(1)
    return if (ratio < 0.15f) 0f else if (ratio < 0.6f) 0.45f else 1f
}

// ---------- Compact post row (56dp) ----------

@Composable
fun PostRow(item: Listing, billing: BillingManager, onOpen: () -> Unit) {
    val m = Mono
    val locked = !billing.canSee(item.id, item.premium)
    Row(
        Modifier.fillMaxWidth().height(56.dp).clickable(onClick = onOpen).padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        TypeTile(28) { KindIcon(item.kind, 14) }
        Column(Modifier.weight(1f)) {
            LockedBlur(locked, compact = true, onUnlock = { billing.paywall = PaywallReason.Unlock(item.id) }) {
                Text(item.value, fontSize = 14.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.SemiBold, color = m.fg, maxLines = 1)
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(item.category, fontSize = 11.sp, color = m.muted)
                if (item.premium) Pill("PRO", solid = true)
                Text("· ★ ${"%.1f".format(item.rating)}", fontSize = 11.sp, color = m.muted)
            }
        }
        if (item.mine) BoostButton(item.id, billing)
        Text("$${item.priceUSD}", fontSize = 13.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.SemiBold, color = m.fg)
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(m.line))
}

@Composable
fun BoostButton(itemId: String, billing: BillingManager) {
    val m = Mono
    if (billing.isBoosted(itemId)) Pill("BOOSTED", solid = true)
    else Text(
        "↑ Boost", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = m.fg,
        modifier = Modifier
            .border(1.dp, m.fg, RoundedCornerShape(4.dp))
            .clickable { if (!billing.boost(itemId)) billing.paywall = PaywallReason.Boost(itemId) }
            .padding(horizontal = 8.dp, vertical = 6.dp),
    )
}

// ---------- Product tile (132×116) + single-line LazyRow ----------

@Composable
fun ProductTile(item: Listing, promotion: String?, billing: BillingManager, onOpen: () -> Unit) {
    val m = Mono
    val locked = !billing.canSee(item.id, item.premium)
    Column(
        Modifier
            .size(132.dp, 116.dp)
            .border(1.dp, if (promotion == null) m.line else m.fg, RoundedCornerShape(8.dp))
            .clickable(onClick = onOpen)
            .padding(8.dp),
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            TypeTile(22) { KindIcon(item.kind, 11) }
            when {
                promotion != null -> Pill(promotion, solid = promotion == "BOOSTED")
                item.premium -> Pill("PRO", solid = true)
            }
        }
        LockedBlur(locked, compact = true, onUnlock = { billing.paywall = PaywallReason.Unlock(item.id) }) {
            Text(item.value, fontSize = 14.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.SemiBold, color = m.fg, maxLines = 1)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
            Text(item.category, fontSize = 10.sp, color = m.muted, maxLines = 1, modifier = Modifier.weight(1f, fill = false))
            Text("$${item.priceUSD}", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.SemiBold, color = m.fg)
        }
    }
}

@Composable
fun ProductRow(vm: FeedViewModel, billing: BillingManager, onOpen: (Listing) -> Unit) {
    val m = Mono
    val state = rememberLazyListState()
    val row = vm.productRow
    Column(Modifier.padding(vertical = 12.dp)) {
        SectionLabel("PRODUCTS", row.size.toString())
        LazyRow(
            state = state,
            flingBehavior = rememberSnapFlingBehavior(state),
            contentPadding = PaddingValues(horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.edgeFadeX(24.dp),
        ) {
            itemsIndexed(row, key = { _, it -> it.id }) { i, item ->
                // derivedStateOf: only this tile recomposes when its own band changes.
                val vis by remember { derivedStateOf { state.layoutInfo.visibilityOf(item.id) } }
                Box(Modifier.viewportFade(vis)) { ProductTile(item, vm.promotion(i, item), billing) { onOpen(item) } }
            }
        }
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(m.line))
}

/** Progressive edge fade on both ends of the row (DstIn mask, single offscreen layer). */
fun Modifier.edgeFadeX(width: androidx.compose.ui.unit.Dp) = graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
    .drawWithContent {
        drawContent()
        val w = width.toPx()
        drawRect(Brush.horizontalGradient(0f to Color.Transparent, 1f to Color.Black, endX = w), blendMode = BlendMode.DstIn)
        drawRect(Brush.horizontalGradient(0f to Color.Black, 1f to Color.Transparent, startX = size.width - w, endX = size.width), blendMode = BlendMode.DstIn)
    }

// ---------- Home ----------

@Composable
fun HomeScreen(vm: FeedViewModel, billing: BillingManager, tab: Int, onOpen: (Listing) -> Unit) {
    val m = Mono
    Column(Modifier.fillMaxSize().background(m.bg)) {
        Row(Modifier.fillMaxWidth().height(48.dp).padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("NikBozor", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = m.fg)
            Spacer(Modifier.weight(1f))
            Row(
                Modifier.clickable { billing.paywall = if (billing.isPro) PaywallReason.Coins else PaywallReason.Upgrade },
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Pill("PRO", solid = billing.isPro)
                Text("${billing.entitlements.collectAsState().value.coins}", fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = m.muted)
            }
        }
        // Tab/category switch → opacity-only cross-fade of the whole body.
        AnimatedContent(targetState = tab, transitionSpec = { fadeIn(tween(160)) togetherWith fadeOut(tween(160)) }, label = "feed") { _ ->
            val state = rememberLazyListState()
            LazyColumn(state = state, modifier = Modifier.fillMaxSize()) {
                item(key = "products") { ProductRow(vm, billing, onOpen) }
                item(key = "label") { SectionLabel("LISTINGS", vm.items.size.toString(), Modifier.padding(top = 12.dp, bottom = 4.dp)) }
                items(vm.items, key = { it.id }) { item ->
                    val vis by remember { derivedStateOf { state.layoutInfo.visibilityOf(item.id) } }
                    Box(Modifier.viewportFade(vis)) { PostRow(item, billing) { onOpen(item) } }
                }
            }
        }
    }
}

@Composable
fun SectionLabel(text: String, count: String, modifier: Modifier = Modifier) {
    val m = Mono
    Row(modifier.fillMaxWidth().padding(horizontal = 12.dp).padding(bottom = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(text, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp, color = m.muted)
        Text(count, fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = m.muted)
    }
}

/** Placeholder glyphs; swap for Material icons / brand vector assets. */
@Composable
fun KindIcon(kind: Kind, size: Int) {
    Text(when (kind) { Kind.PHONE -> "☏"; Kind.TELEGRAM -> "➤"; Kind.INSTAGRAM -> "◎" }, fontSize = size.sp, color = Mono.fg)
}
