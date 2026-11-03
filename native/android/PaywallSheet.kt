package uz.nikbozor.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.nikbozor.billing.BillingManager
import uz.nikbozor.billing.PaywallReason
import uz.nikbozor.billing.Pricing
import uz.nikbozor.billing.ProductId
import uz.nikbozor.billing.PurchaseResult

/** Strict black-and-white subscription sheet: Monthly / Yearly / Lifetime / Coins + fee breakdown. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaywallSheet(billing: BillingManager) {
    val reason = billing.paywall ?: return
    val m = Mono
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val ent by billing.entitlements.collectAsState()
    var selected by remember(reason) { mutableStateOf(if (reason is PaywallReason.Boost || reason is PaywallReason.Coins) ProductId.COINS_100 else ProductId.YEARLY) }
    LaunchedEffect(Unit) { if (billing.products.isEmpty()) billing.load() }
    val unlockId = (reason as? PaywallReason.Unlock)?.itemId

    ModalBottomSheet(
        onDismissRequest = { billing.paywall = null },
        sheetState = sheet,
        containerColor = m.bg,
        dragHandle = { Box(Modifier.padding(top = 10.dp).size(36.dp, 4.dp).background(m.lineStrong, CircleShape)) },
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
    ) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("NikBozor Pro", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = m.fg)
            Text(
                when (reason) {
                    is PaywallReason.Unlock -> "This listing is premium. Go Pro or unlock it with coins."
                    is PaywallReason.Boost -> "Boosting needs coins. Top up to put your listing first."
                    PaywallReason.Coins -> "Top up coins for unlocks and boosts."
                    PaywallReason.Upgrade -> "Lower fees, full access, no limits."
                }, fontSize = 13.sp, color = m.muted,
            )

            if (unlockId != null && !billing.isPro) Row(
                Modifier.fillMaxWidth().height(48.dp).border(1.dp, m.lineStrong, RoundedCornerShape(8.dp))
                    .clickable { if (billing.unlock(unlockId)) billing.paywall = null }.padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("Unlock for ${Pricing.UNLOCK_COST} coins", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = m.fg)
                Text("${ent.coins} coins", fontSize = 12.sp, fontFamily = FontFamily.Monospace, color = m.muted)
            }

            PlanRow(ProductId.MONTHLY, "Monthly", "/mo", selected, billing) { selected = it }
            PlanRow(ProductId.YEARLY, "Yearly", "/yr", selected, billing) { selected = it }
            PlanRow(ProductId.LIFETIME, "Lifetime", "once", selected, billing) { selected = it }
            Box(Modifier.fillMaxWidth().height(1.dp).background(m.line))
            PlanRow(ProductId.COINS_100, "100 Coins", "once", selected, billing) { selected = it }
            PlanRow(ProductId.COINS_500, "500 Coins", "once", selected, billing) { selected = it }

            FeeBreakdown()

            MonoButton(
                text = if (billing.busy) "" else "Continue", enabled = !billing.busy, modifier = Modifier.fillMaxWidth(),
                leading = if (billing.busy) ({ CircularProgressIndicator(Modifier.size(16.dp), color = m.bg, strokeWidth = 2.dp) }) else null,
                onClick = {
                    billing.purchase(selected) { r ->
                        if (r == PurchaseResult.SUCCESS) {
                            if (unlockId != null && !billing.isPro) billing.unlock(unlockId)
                            billing.paywall = null
                        }
                    }
                },
            )
            Text("Restore purchases", fontSize = 12.sp, color = m.muted, textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().clickable { billing.restore() }.padding(vertical = 10.dp))
            Text("Cancel anytime. Prices in local currency at checkout.", fontSize = 11.sp, color = m.muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
private fun PlanRow(id: ProductId, label: String, suffix: String, selected: ProductId, billing: BillingManager, onSelect: (ProductId) -> Unit) {
    val m = Mono
    val p = billing.products.firstOrNull { it.id == id }
    val active = selected == id
    Row(
        Modifier.fillMaxWidth().height(56.dp)
            .border(1.dp, if (active) m.fg else m.line, RoundedCornerShape(8.dp))
            .clickable { onSelect(id) }.padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(Modifier.size(16.dp).background(if (active) m.fg else Color.Transparent, CircleShape).border(1.dp, if (active) m.fg else m.lineStrong, CircleShape), contentAlignment = Alignment.Center) {
            if (active) Text("✓", fontSize = 8.sp, fontWeight = FontWeight.Black, color = m.bg)
        }
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = m.fg)
        p?.badge?.let { Text(it, fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = m.fg, modifier = Modifier.border(1.dp, m.fg, RoundedCornerShape(4.dp)).padding(horizontal = 4.dp)) }
        Spacer(Modifier.weight(1f))
        Text(p?.price ?: "…", fontSize = 14.sp, fontFamily = FontFamily.Monospace, color = m.fg)
        Text(suffix, fontSize = 11.sp, color = m.muted)
    }
}

@Composable
private fun FeeBreakdown(sample: Long = 10_000_000) {
    val m = Mono
    Column(Modifier.fillMaxWidth().border(1.dp, m.line, RoundedCornerShape(8.dp)).padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("FEE BREAKDOWN", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp, color = m.muted)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Free · 5%", fontSize = 13.sp, color = m.muted); Text("${(sample * 0.05).toLong()} UZS", fontSize = 13.sp, fontFamily = FontFamily.Monospace, color = m.fg)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Pro · 2%", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = m.fg); Text("${(sample * 0.02).toLong()} UZS", fontSize = 13.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.SemiBold, color = m.fg)
        }
        Text("You save ${(sample * 0.03).toLong()} UZS with Pro", fontSize = 11.sp, color = m.muted)
    }
}
