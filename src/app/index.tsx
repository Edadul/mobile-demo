import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Palette = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  primary: string;
  onPrimary: string;
  yellow: string;
  mint: string;
  coral: string;
  soft: string;
};

const PALETTES: Record<'light' | 'dark', Palette> = {
  light: {
    bg: '#f2efff', surface: '#ffffff', ink: '#1e1b3a', muted: '#5d5880', line: '#ddd7f5',
    primary: '#5b3df5', onPrimary: '#ffffff', yellow: '#ffc21a', mint: '#0fa77c', coral: '#e8395f', soft: '#e8e3ff',
  },
  dark: {
    bg: '#16142b', surface: '#221f3d', ink: '#eceaff', muted: '#aaa6cc', line: '#363160',
    primary: '#8b73ff', onPrimary: '#16142b', yellow: '#ffd24a', mint: '#3ddbab', coral: '#ff7896', soft: '#2c2850',
  },
};

const spring = { speed: 20, bounciness: 12, useNativeDriver: true } as const;

function DemoCard({
  number,
  title,
  description,
  palette,
  children,
}: {
  number: string;
  title: string;
  description: string;
  palette: Palette;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.tile, { width: width >= 780 ? '48.7%' : '100%', backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={styles.tileHeading}>
        <Text style={[styles.tileNumber, { color: palette.primary }]}>{number}</Text>
        <Text style={[styles.tileTitle, { color: palette.ink }]}>{title}</Text>
      </View>
      <View style={styles.demo}>{children}</View>
      <Text style={[styles.caption, { color: palette.muted }]}>{description}</Text>
    </View>
  );
}

function Toggle({
  value,
  onPress,
  palette,
  disabled = false,
  animated = true,
  accessibilityLabel,
}: {
  value: boolean;
  onPress: () => void;
  palette: Palette;
  disabled?: boolean;
  animated?: boolean;
  accessibilityLabel: string;
}) {
  const [position] = useState(() => new Animated.Value(value ? 1 : 0));
  useEffect(() => {
    if (animated) Animated.spring(position, { toValue: value ? 1 : 0, ...spring }).start();
    else position.setValue(value ? 1 : 0);
  }, [animated, position, value]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.toggle, { backgroundColor: value ? palette.primary : palette.line, opacity: disabled ? 0.55 : 1 }]}>
      <Animated.View style={[styles.toggleKnob, { transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }) }] }]}>
        <Text style={[styles.toggleGlyph, { color: value ? palette.primary : palette.muted }]}>{value ? '✓' : '×'}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const systemScheme = useColorScheme();
  const [dark, setDark] = useState(systemScheme === 'dark');
  const [effectsOn, setEffectsOn] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(127);
  const [wifiOn, setWifiOn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartPhase, setCartPhase] = useState<'idle' | 'adding' | 'flying' | 'added'>('idle');
  const [rating, setRating] = useState(0);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [toast, setToast] = useState('');
  const [undoAvailable, setUndoAvailable] = useState(false);
  const cartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoValue = useRef(false);
  const [heartScale] = useState(() => new Animated.Value(1));
  const [cartButtonScale] = useState(() => new Animated.Value(1));
  const [cartScale] = useState(() => new Animated.Value(1));
  const [cartDot] = useState(() => new Animated.Value(0));
  const [shakeX] = useState(() => new Animated.Value(0));
  const [starScales] = useState(() => Array.from({ length: 5 }, () => new Animated.Value(1)));

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) {
        setReduceMotion(value);
        if (value) setEffectsOn(false);
      }
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setReduceMotion(value);
      if (value) setEffectsOn(false);
    });
    return () => {
      mounted = false;
      subscription.remove();
      if (cartTimer.current) clearTimeout(cartTimer.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const palette = PALETTES[dark ? 'dark' : 'light'];
  const animate = effectsOn && !reduceMotion;

  const showToast = (message: string, canUndo = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    setUndoAvailable(canUndo);
    toastTimer.current = setTimeout(() => {
      setToast('');
      setUndoAvailable(false);
    }, 2800);
  };

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikes((current) => current + (next ? 1 : -1));
    if (animate && next) {
      heartScale.setValue(0.68);
      Animated.spring(heartScale, { toValue: 1, ...spring }).start();
    }
  };

  const addToCart = () => {
    if (cartPhase === 'adding' || cartPhase === 'flying') return;
    if (cartTimer.current) clearTimeout(cartTimer.current);
    if (!animate) {
      setCartCount((current) => current + 1);
      setCartPhase('added');
      return;
    }
    setCartPhase('adding');
    cartTimer.current = setTimeout(() => {
      setCartPhase('flying');
      cartDot.setValue(0);
      Animated.timing(cartDot, { toValue: 1, duration: 650, useNativeDriver: true }).start();
      cartTimer.current = setTimeout(() => {
        setCartCount((current) => current + 1);
        setCartPhase('added');
      Animated.sequence([
        Animated.spring(cartScale, { toValue: 1.45, ...spring }),
        Animated.spring(cartScale, { toValue: 1, ...spring }),
      ]).start();
      cartTimer.current = null;
      }, 650);
    }, 700);
  };

  const handleCopy = () => {
    setCopied(true);
    showToast('Enlace copiado');
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
    void Clipboard.setStringAsync('https://toque.demo/microinteracciones').catch(() => undefined);
  };

  const updateNotifications = () => {
    undoValue.current = notificationsOn;
    const next = !notificationsOn;
    setNotificationsOn(next);
    showToast(next ? 'Notificaciones activadas' : 'Notificaciones pausadas', true);
  };

  const undoNotifications = () => {
    if (!undoAvailable) return;
    setNotificationsOn(undoValue.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast('Cambio deshecho');
    setUndoAvailable(false);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  const resetDemo = () => {
    if (cartTimer.current) clearTimeout(cartTimer.current);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    heartScale.stopAnimation();
    cartButtonScale.stopAnimation();
    cartScale.stopAnimation();
    cartDot.stopAnimation();
    shakeX.stopAnimation();
    starScales.forEach((star) => {
      star.stopAnimation();
      star.setValue(1);
    });
    heartScale.setValue(1);
    cartButtonScale.setValue(1);
    cartScale.setValue(1);
    cartDot.setValue(0);
    shakeX.setValue(0);
    setDark(systemScheme === 'dark');
    setEffectsOn(!reduceMotion);
    setLiked(false);
    setLikes(127);
    setWifiOn(false);
    setCartCount(0);
    setCartPhase('idle');
    setRating(0);
    setCopied(false);
    setQuantity(1);
    setPassword('');
    setPasswordVisible(false);
    setNotificationsOn(false);
    setUndoAvailable(false);
    setToast('');
  };

  const strength = password.length === 0 ? 0 : Math.max(1,
    Number(password.length >= 8) +
    Number(/[A-Z]/.test(password) && /[a-z]/.test(password)) +
    Number(/\d/.test(password)) +
    Number(/[^A-Za-z0-9]/.test(password)));
  const strengthLabel = ['', 'Débil: agrega más caracteres.', 'Regular: suma números o símbolos.', 'Buena: casi lista.', 'Fuerte. Así sí.'][strength];
  const strengthColor = strength <= 1 ? palette.coral : strength <= 3 ? palette.yellow : palette.mint;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.bg }]}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.nav, { borderBottomColor: palette.line }]}>
          <View>
            <Text style={[styles.logo, { color: palette.ink }]}>toque<Text style={{ color: palette.primary }}>.</Text></Text>
            <Text style={[styles.brandCaption, { color: palette.muted }]}>MICROINTERACCIONES QUE SE SIENTEN</Text>
          </View>
          <View style={styles.navActions}>
            <Text style={[styles.smallLabel, { color: palette.muted }]}>{dark ? 'Oscuro' : 'Claro'}</Text>
            <Toggle value={dark} onPress={() => setDark((value) => !value)} animated={animate} palette={palette} accessibilityLabel="Cambiar tema claro u oscuro" />
          </View>
        </View>

        <View style={[styles.masterPanel, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={styles.masterCopy}>
            <Text style={[styles.masterTitle, { color: palette.ink }]}>Microinteracciones</Text>
            <Text style={[styles.masterHint, { color: palette.muted }]}>{animate ? 'Activadas · prueba cada control' : 'Apagadas · acciones instantáneas'}</Text>
          </View>
          <Toggle value={animate} disabled={reduceMotion} onPress={() => setEffectsOn((value) => !value)} animated={animate} palette={palette} accessibilityLabel="Activar o apagar las microinteracciones" />
        </View>
        {reduceMotion && <Text style={[styles.reduceNote, { color: palette.muted }]}>El sistema tiene activado el movimiento reducido.</Text>}

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: palette.primary }]}>UN TOQUE, UNA RESPUESTA</Text>
          <Text style={[styles.headline, { color: palette.ink }]}>Que cada toque{ '\n' }se sienta.</Text>
          <Text style={[styles.lead, { color: palette.muted }]}>Diez detalles que confirman que la interfaz te escuchó. Pruébalos y apaga las microinteracciones para comparar.</Text>
        </View>

        <View style={styles.grid}>
          <DemoCard number="01" title="Cambiar el tema" description="El interruptor de arriba cambia los colores de toda la pantalla." palette={palette}>
            <View style={styles.inlineDemo}>
              <Text style={[styles.demoValue, { color: palette.ink }]}>{dark ? 'Tema oscuro' : 'Tema claro'}</Text>
              <Text style={[styles.demoSymbol, { color: palette.primary }]}>{dark ? '☾' : '☼'}</Text>
            </View>
          </DemoCard>

          <DemoCard number="02" title="Marcar como favorito" description="El corazón y el número responden juntos; tócalo otra vez para deshacer." palette={palette}>
            <View style={styles.inlineDemo}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Pressable accessibilityRole="button" accessibilityLabel={liked ? 'Quitar me gusta' : 'Me gusta'} accessibilityState={{ selected: liked }} onPress={handleLike} style={[styles.likeButton, { backgroundColor: palette.soft }]}>
                  <Text style={[styles.heart, { color: liked ? palette.coral : palette.ink }]}>{liked ? '♥' : '♡'}</Text>
                </Pressable>
              </Animated.View>
              <Text style={[styles.demoValue, { color: palette.ink }]}>{likes} me gusta</Text>
            </View>
          </DemoCard>

          <DemoCard number="03" title="Encender el Wi-Fi" description="El color y la etiqueta hacen visible el estado del interruptor." palette={palette}>
            <View style={styles.inlineDemo}>
              <Toggle value={wifiOn} onPress={() => setWifiOn((value) => !value)} animated={animate} palette={palette} accessibilityLabel="Wi-Fi" />
              <Text style={[styles.demoValue, { color: palette.ink }]}>{wifiOn ? 'Encendido' : 'Apagado'}</Text>
            </View>
          </DemoCard>

          <DemoCard number="04" title="Agregar al carrito" description="Muestra carga, éxito, vuelo al carrito y el nuevo total." palette={palette}>
            <View style={styles.cartDemo}>
              <Pressable accessibilityRole="button" disabled={cartPhase === 'adding' || cartPhase === 'flying'} onPress={addToCart} onPressIn={() => animate && cartPhase !== 'adding' && cartPhase !== 'flying' && Animated.spring(cartButtonScale, { toValue: 0.96, ...spring }).start()} onPressOut={() => animate && Animated.spring(cartButtonScale, { toValue: 1, ...spring }).start()} style={{ flex: 1 }}>
                <Animated.View style={[styles.cartButton, { backgroundColor: cartPhase === 'added' ? palette.mint : palette.primary, transform: [{ scale: cartButtonScale }] }]}>
                  <Text style={[styles.cartButtonText, { color: palette.onPrimary }]}>{cartPhase === 'adding' ? 'Agregando…' : cartPhase === 'flying' ? 'Casi listo…' : cartPhase === 'added' ? '✓  Agregado' : 'Agregar al carrito'}</Text>
                </Animated.View>
              </Pressable>
              <View style={[styles.cartIcon, { backgroundColor: palette.soft }]}>
                <Text style={[styles.cartGlyph, { color: palette.ink }]}>🛒</Text>
                <Animated.View style={[styles.badge, { backgroundColor: palette.coral, transform: [{ scale: cartCount > 0 ? cartScale : 0 }] }]}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </Animated.View>
              </View>
              {cartPhase === 'flying' && animate && <Animated.View pointerEvents="none" style={[styles.cartDot, { backgroundColor: palette.coral, opacity: cartDot.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateX: cartDot.interpolate({ inputRange: [0, 1], outputRange: [0, 165] }) }, { translateY: cartDot.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) }, { scale: cartDot.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) }] }]} />}
            </View>
          </DemoCard>

          <DemoCard number="05" title="Calificar una experiencia" description="La selección queda marcada y las estrellas saltan en cadena." palette={palette}>
            <View style={styles.ratingRow} accessibilityRole="radiogroup" accessibilityLabel="Calificación">
              {starScales.map((scale, index) => (
                <Animated.View key={index} style={{ transform: [{ scale }] }}>
                  <Pressable accessibilityRole="radio" accessibilityLabel={`${index + 1} de 5`} accessibilityState={{ checked: rating === index + 1 }} onPress={() => {
                    const next = index + 1;
                    setRating(next);
                    if (animate) Animated.stagger(65, starScales.slice(0, next).map((star) => Animated.sequence([
                      Animated.spring(star, { toValue: 1.3, ...spring }),
                      Animated.spring(star, { toValue: 1, ...spring }),
                    ]))).start();
                  }} style={styles.starButton}>
                    <Text style={{ color: index < rating ? palette.yellow : palette.line, fontSize: 34 }}>★</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </DemoCard>

          <DemoCard number="06" title="Copiar un enlace" description="El icono cambia a un check y aparece una confirmación breve." palette={palette}>
            <Pressable accessibilityRole="button" onPress={handleCopy} style={[styles.outlineButton, { borderColor: palette.line }]}>
              <Text style={[styles.demoValue, { color: copied ? palette.mint : palette.ink }]}>{copied ? '✓  Copiado' : '▢  Copiar enlace'}</Text>
            </Pressable>
          </DemoCard>

          <DemoCard number="07" title="Elegir cantidad" description="El número rebota al cambiar; no permite bajar de cero." palette={palette}>
            <View style={styles.inlineDemo}>
              <Pressable accessibilityRole="button" accessibilityLabel="Quitar uno" onPress={() => {
                if (quantity === 0) {
                  if (animate) Animated.sequence([Animated.timing(shakeX, { toValue: -6, duration: 45, useNativeDriver: true }), Animated.timing(shakeX, { toValue: 6, duration: 70, useNativeDriver: true }), Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true })]).start();
                  return;
                }
                setQuantity((value) => value - 1);
              }} style={[styles.stepButton, { backgroundColor: palette.soft }]}><Text style={[styles.stepText, { color: palette.ink }]}>−</Text></Pressable>
              <Animated.Text accessibilityLiveRegion="polite" style={[styles.quantity, { color: palette.ink, transform: [{ translateX: shakeX }] }]}>{quantity}</Animated.Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Agregar uno" onPress={() => setQuantity((value) => value + 1)} style={[styles.stepButton, { backgroundColor: palette.soft }]}><Text style={[styles.stepText, { color: palette.ink }]}>+</Text></Pressable>
            </View>
          </DemoCard>

          <DemoCard number="08" title="Crear una contraseña" description="El medidor y el consejo cambian mientras escribes." palette={palette}>
            <View style={styles.passwordDemo}>
              <View style={[styles.passwordField, { backgroundColor: palette.bg, borderColor: palette.line }]}>
                <TextInput accessibilityLabel="Contraseña de prueba" value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} placeholder="Escribe una contraseña" placeholderTextColor={palette.muted} autoCapitalize="none" style={[styles.passwordInput, { color: palette.ink }]} />
                <Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setPasswordVisible((value) => !value)}><Text style={{ color: palette.primary, fontSize: 12, fontWeight: '800' }}>{passwordVisible ? 'Ocultar' : 'Ver'}</Text></Pressable>
              </View>
              <View style={[styles.meterTrack, { backgroundColor: palette.line }]}><View style={{ width: `${strength * 25}%`, height: '100%', backgroundColor: strengthColor, borderRadius: 5 }} /></View>
              <Text style={[styles.strengthText, { color: palette.muted }]}>{strengthLabel || 'Usa 8 caracteres, mayúsculas, números y símbolos.'}</Text>
            </View>
          </DemoCard>

          <DemoCard number="09" title="Activar notificaciones" description="El toast da opción de deshacer el cambio durante unos segundos." palette={palette}>
            <View style={styles.inlineDemo}>
              <Toggle value={notificationsOn} onPress={updateNotifications} animated={animate} palette={palette} accessibilityLabel="Notificaciones" />
              <Text style={[styles.demoValue, { color: palette.ink }]}>{notificationsOn ? 'Activadas' : 'Pausadas'}</Text>
            </View>
          </DemoCard>

          <DemoCard number="10" title="Deshacer una acción" description="Activa las notificaciones y toca Deshacer para revertir el cambio." palette={palette}>
            <Pressable accessibilityRole="button" disabled={!undoAvailable} onPress={undoNotifications} style={[styles.outlineButton, { borderColor: palette.line, opacity: undoAvailable ? 1 : 0.5 }]}>
              <Text style={[styles.demoValue, { color: palette.ink }]}>↶  Deshacer</Text>
            </Pressable>
          </DemoCard>
        </View>

        <View style={[styles.footer, { borderTopColor: palette.line }]}>
          <Text style={[styles.footerText, { color: palette.muted }]}>Toca, observa y compara. Todo funciona en esta pantalla, sin compras ni servicios externos.</Text>
          <Pressable accessibilityRole="button" onPress={resetDemo} style={[styles.resetButton, { borderColor: palette.line }]}><Text style={[styles.resetText, { color: palette.muted }]}>Reiniciar demo</Text></Pressable>
        </View>
      </ScrollView>
      {toast !== '' && (
        <View accessibilityRole="alert" style={[styles.toast, { backgroundColor: palette.ink }]}>
          <Text style={[styles.toastText, { color: palette.bg }]}>{toast}</Text>
          {undoAvailable && <Pressable accessibilityRole="button" onPress={undoNotifications} style={[styles.undoButton, { backgroundColor: palette.primary }]}><Text style={[styles.undoText, { color: palette.onPrimary }]}>Deshacer</Text></Pressable>}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  page: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 40 },
  nav: { width: '100%', maxWidth: 1180, minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  logo: { fontSize: 26, fontWeight: '900', letterSpacing: -1.3 },
  brandCaption: { fontSize: 7, letterSpacing: 1.5, fontWeight: '700', marginTop: 1 },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  smallLabel: { fontSize: 11, fontWeight: '700' },
  toggle: { width: 58, height: 34, borderRadius: 18, padding: 4, justifyContent: 'center' },
  toggleKnob: { width: 26, height: 26, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  toggleGlyph: { fontSize: 14, fontWeight: '900' },
  masterPanel: { width: '100%', maxWidth: 1180, marginTop: 18, minHeight: 72, borderRadius: 18, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  masterCopy: { flex: 1, marginRight: 12 },
  masterTitle: { fontSize: 14, fontWeight: '800' },
  masterHint: { fontSize: 11, marginTop: 3 },
  reduceNote: { width: '100%', maxWidth: 1180, fontSize: 11, marginTop: 8 },
  hero: { width: '100%', maxWidth: 900, alignItems: 'center', paddingTop: 42, paddingBottom: 35 },
  eyebrow: { fontSize: 9, letterSpacing: 2.2, fontWeight: '800' },
  headline: { fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: -1.7, textAlign: 'center', marginTop: 9 },
  lead: { maxWidth: 570, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 14 },
  grid: { width: '100%', maxWidth: 1180, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  tile: { width: '48.7%', minHeight: 220, borderRadius: 22, borderWidth: 1, padding: 19, justifyContent: 'space-between' },
  tileHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tileNumber: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tileTitle: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
  demo: { minHeight: 104, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  caption: { fontSize: 10, lineHeight: 15, minHeight: 30 },
  inlineDemo: { width: '100%', minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  demoValue: { fontSize: 13, fontWeight: '800' },
  demoSymbol: { fontSize: 34, fontWeight: '700' },
  likeButton: { width: 58, height: 58, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  heart: { fontSize: 34, lineHeight: 40 },
  cartDemo: { width: '100%', position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  cartButton: { minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  cartButtonText: { fontSize: 11, fontWeight: '800' },
  cartIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cartGlyph: { fontSize: 24 },
  badge: { position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  cartDot: { position: 'absolute', left: '42%', top: 15, width: 12, height: 12, borderRadius: 7 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starButton: { paddingHorizontal: 3, paddingVertical: 6 },
  outlineButton: { minHeight: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  stepButton: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  quantity: { minWidth: 35, textAlign: 'center', fontSize: 28, fontWeight: '900' },
  passwordDemo: { width: '100%', gap: 9 },
  passwordField: { minHeight: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1, minWidth: 0, paddingVertical: 8, fontSize: 11, outlineStyle: 'none' } as any,
  meterTrack: { width: '100%', height: 7, borderRadius: 5, overflow: 'hidden' },
  strengthText: { fontSize: 9, lineHeight: 13 },
  footer: { width: '100%', maxWidth: 1180, borderTopWidth: 1, marginTop: 32, paddingTop: 20, alignItems: 'center' },
  footerText: { textAlign: 'center', fontSize: 10, lineHeight: 15 },
  resetButton: { marginTop: 12, paddingHorizontal: 15, paddingVertical: 9, borderWidth: 1, borderRadius: 13 },
  resetText: { fontSize: 11, fontWeight: '800' },
  toast: { position: 'absolute', bottom: 20, alignSelf: 'center', minHeight: 54, maxWidth: '92%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 15, elevation: 8 },
  toastText: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  undoButton: { borderRadius: 11, paddingHorizontal: 13, paddingVertical: 9 },
  undoText: { fontSize: 11, fontWeight: '800' },
});
