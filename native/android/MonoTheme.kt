package uz.nikbozor.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Strict monochrome tokens. */
data class MonoColors(val bg: Color, val fg: Color, val muted: Color, val line: Color, val lineStrong: Color, val surface2: Color)

val LightMono = MonoColors(Color(0xFFFFFFFF), Color(0xFF000000), Color(0xFF6B6B6B), Color(0xFFE4E4E4), Color(0xFFBDBDBD), Color(0xFFF4F4F4))
val DarkMono = MonoColors(Color(0xFF000000), Color(0xFFFFFFFF), Color(0xFF8C8C8C), Color(0xFF222222), Color(0xFF3A3A3A), Color(0xFF121212))
val LocalMono = staticCompositionLocalOf { DarkMono }
val Mono: MonoColors @Composable get() = LocalMono.current

@Composable
fun MonoTheme(dark: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) =
    CompositionLocalProvider(LocalMono provides if (dark) DarkMono else LightMono, content = content)

/** `[AD]`, `[PRO]`, `[BOOSTED]`, `[DEMO]` */
@Composable
fun Pill(text: String, solid: Boolean = false) {
    val m = Mono
    Text(
        text, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp,
        color = if (solid) m.bg else m.muted,
        modifier = Modifier
            .height(18.dp)
            .background(if (solid) m.fg else Color.Transparent, RoundedCornerShape(4.dp))
            .border(1.dp, if (solid) m.fg else m.lineStrong, RoundedCornerShape(4.dp))
            .padding(horizontal = 5.dp)
            .wrapContentHeight(Alignment.CenterVertically),
    )
}

/** Primary (solid) / outline — the only two button styles. 44dp tall. */
@Composable
fun MonoButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, outline: Boolean = false, enabled: Boolean = true, leading: @Composable (() -> Unit)? = null) {
    val m = Mono
    Row(
        modifier
            .height(44.dp)
            .background(if (outline) Color.Transparent else m.fg, RoundedCornerShape(8.dp))
            .border(1.dp, if (outline) m.lineStrong else m.fg, RoundedCornerShape(8.dp))
            .graphicsLayer { alpha = if (enabled) 1f else 0.4f }
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
    ) {
        leading?.let { it(); Spacer(Modifier.width(8.dp)) }
        Text(text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = if (outline) m.fg else m.bg)
    }
}

/** Icon tile with 1px border; types are never colour-coded. */
@Composable
fun TypeTile(size: Int = 28, icon: @Composable () -> Unit) {
    Box(Modifier.size(size.dp).border(1.dp, Mono.lineStrong, RoundedCornerShape(6.dp)), contentAlignment = Alignment.Center) { icon() }
}

/**
 * Viewport fade + blur. `visibility` ∈ [0,1] is computed by the list from LazyListState
 * (see FeedScreens.kt `visibilityOf`). Only alpha + blur change → no recomposition of children,
 * no layout; `graphicsLayer` keeps it on the render thread.
 */
@Composable
fun Modifier.viewportFade(visibility: Float): Modifier {
    val v by animateFloatAsState(targetValue = visibility, animationSpec = tween(220), label = "fade")
    return this
        .graphicsLayer { alpha = v }
        .blur(((1f - v) * 6).dp)
}

/** Freemium gate: blurred content + "Unlock" trigger fading in. */
@Composable
fun LockedBlur(locked: Boolean, compact: Boolean = false, onUnlock: () -> Unit, content: @Composable () -> Unit) {
    val m = Mono
    Box {
        Box(Modifier.blur(if (locked) 7.dp else 0.dp)) { content() }
        AnimatedVisibility(visible = locked, enter = fadeIn(tween(200)), exit = fadeOut(tween(200)), modifier = Modifier.matchParentSize()) {
            Box(Modifier.fillMaxSize().clickable(onClick = onUnlock), contentAlignment = Alignment.Center) {
                Text(
                    if (compact) "Unlock" else "Unlock for ${uz.nikbozor.billing.Pricing.UNLOCK_COST} coins",
                    fontSize = if (compact) 11.sp else 13.sp, fontWeight = FontWeight.SemiBold, color = m.fg,
                    modifier = Modifier
                        .background(m.bg, RoundedCornerShape(6.dp))
                        .border(1.dp, m.fg, RoundedCornerShape(6.dp))
                        .padding(horizontal = if (compact) 8.dp else 12.dp, vertical = if (compact) 5.dp else 8.dp),
                )
            }
        }
    }
}
