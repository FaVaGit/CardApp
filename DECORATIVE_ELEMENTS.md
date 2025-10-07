# Elementi Decorativi - Gioco della Complicità

Questa documentazione descrive gli elementi decorativi aggiunti all'app per migliorare l'esperienza visiva mantenendo il tema romantico e di coppia.

## Componenti Decorativi Creati

### 1. FloatingHearts.jsx
**Descrizione**: Cuori fluttuanti animati per creare atmosfera romantica
**Props**:
- `count` (numero, default: 6): Numero di cuori da mostrare
- `size` ('small'|'medium'|'large', default: 'medium'): Dimensione dei cuori
- `speed` ('slow'|'normal'|'fast', default: 'normal'): Velocità dell'animazione

**Utilizzo**:
```jsx
<FloatingHearts count={8} size="medium" speed="normal" />
```

### 2. GradientOverlay.jsx
**Descrizione**: Overlay con gradienti decorativi per aggiungere profondità
**Props**:
- `variant` ('romantic'|'sunset'|'aurora'|'gentle', default: 'romantic'): Tipo di gradiente
- `intensity` ('low'|'medium'|'high', default: 'medium'): Intensità dell'effetto
- `position` ('background'|'middle'|'foreground', default: 'background'): Z-index dell'overlay

**Utilizzo**:
```jsx
<GradientOverlay variant="romantic" intensity="medium" />
```

### 3. AnimatedBorder.jsx
**Descrizione**: Bordi animati per contenitori eleganti
**Props**:
- `variant` ('glow'|'pulse'|'gradient', default: 'glow'): Tipo di animazione
- `color` ('pink'|'purple'|'blue', default: 'purple'): Schema colori
- `speed` ('slow'|'normal'|'fast', default: 'normal'): Velocità animazione
- `thickness` ('thin'|'medium'|'thick', default: 'medium'): Spessore bordo

**Utilizzo**:
```jsx
<AnimatedBorder variant="glow" color="purple">
  <Paper>Contenuto</Paper>
</AnimatedBorder>
```

### 4. FloatingParticles.jsx
**Descrizione**: Particelle animate (stelle, cuori, fiori) per effetti magici
**Props**:
- `count` (numero, default: 15): Numero di particelle
- `type` ('sparkle'|'hearts'|'flowers'|'butterflies', default: 'sparkle'): Tipo di particelle
- `color` ('mixed'|'pink'|'purple'|'blue', default: 'mixed'): Schema colori
- `size` ('small'|'varied'|'large', default: 'varied'): Dimensioni
- `speed` ('slow'|'normal'|'fast', default: 'normal'): Velocità

**Utilizzo**:
```jsx
<FloatingParticles count={12} type="sparkle" color="mixed" />
```

### 5. BackgroundPattern.jsx
**Descrizione**: Pattern di sfondo con motivi geometrici
**Props**:
- `variant` ('hearts'|'dots'|'waves'|'grid', default: 'hearts'): Tipo di pattern
- `opacity` (numero, default: 0.05): Opacità del pattern
- `size` ('small'|'medium'|'large', default: 'medium'): Dimensione pattern
- `color` ('pink'|'purple'|'blue'|'rose', default: 'purple'): Colore

**Utilizzo**:
```jsx
<BackgroundPattern variant="hearts" opacity={0.05} />
```

### 6. DecorativeCard.jsx
**Descrizione**: Carte con effetti glassmorphism e animazioni hover
**Props**:
- `variant` ('romantic'|'elegant'|'dreamy', default: 'romantic'): Stile visivo
- `glowEffect` (boolean, default: false): Effetto luminoso
- `hoverAnimation` (boolean, default: true): Animazione al hover

**Utilizzo**:
```jsx
<DecorativeCard variant="romantic" glowEffect={true}>
  <CardContent>Contenuto</CardContent>
</DecorativeCard>
```

### 7. DecorativeHeader.jsx
**Descrizione**: Header decorativo con elementi romantici
**Props**:
- `title` (string): Titolo principale
- `subtitle` (string): Sottotitolo opzionale
- `icon` (string): Emoji o icona
- `variant` ('romantic'|'elegant'|'dreamy', default: 'romantic'): Stile
- `centerAlign` (boolean, default: true): Allineamento centrale
- `showHearts` (boolean, default: true): Mostra cuori decorativi

**Utilizzo**:
```jsx
<DecorativeHeader 
  title="Complicità" 
  subtitle="Il gioco per le coppie"
  icon="💕"
  variant="romantic"
/>
```

## Animazioni CSS Aggiunte

### Nuove Animazioni
- `animate-bounce-soft`: Rimbalzo delicato
- `animate-pulse-soft`: Pulsazione dolce
- `animate-rotate-slow`: Rotazione lenta
- `animate-gradient-x`: Gradiente orizzontale animato
- `animate-drift`: Movimento laterale
- `animate-twinkle`: Scintillio
- `animate-heartbeat`: Battito cardiaco

### Classi Utility CSS
- `.glass-effect`: Effetto vetro con blur
- `.glass-dark`: Effetto vetro scuro
- `.text-gradient`: Testo con gradiente
- `.shadow-romantic`: Ombra romantica
- `.shadow-soft`: Ombra delicata
- `.bg-romantic-gradient`: Gradiente romantico
- `.bg-sunset-gradient`: Gradiente tramonto
- `.bg-aurora-gradient`: Gradiente aurora

## Integrazione nei Componenti

### AuthPortal.jsx
- **Elementi aggiunti**:
  - GradientOverlay per sfondo romantico
  - FloatingHearts per atmosfera
  - FloatingParticles con stelle scintillanti
  - AnimatedBorder per il form
  - Classi animate per icone e bottoni

### CoupleGame.jsx
- **Elementi aggiunti**:
  - GradientOverlay variante sunset
  - FloatingHearts piccoli e lenti
  - FloatingParticles con cuori
  - AppBar con effetto glass
  - Animazioni per chip e elementi UI

### SimpleApp.jsx (Lobby)
- **Elementi aggiunti**:
  - GradientOverlay delicato
  - FloatingHearts discreti
  - FloatingParticles con fiori
  - Effetti glass per i container
  - Animazioni per bottoni e card

## Considerazioni Performance

### Ottimizzazioni Implementate
1. **Reduced Motion**: Rispetto per le preferenze utente
   ```css
   @media (prefers-reduced-motion: reduce) {
     .animate-* { animation: none !important; }
   }
   ```

2. **Z-Index Management**: Layering appropriato per gli elementi
3. **Opacity Controlled**: Elementi decorativi con bassa opacità per non disturbare la UI
4. **Pointer Events**: `pointer-events: none` per elementi puramente decorativi

### Raccomandazioni
- I componenti decorativi sono ottimizzati per non interferire con l'interazione utente
- Le animazioni sono fluide ma non eccessive per mantenere buone performance
- Gli elementi fluttuanti hanno opacità ridotta per non distrarre dalla UI principale
- Tutti gli effetti rispettano le preferenze di accessibilità

## Temi Colore

### Schema Romantico
- Rosa: `#ec4899`, `#f472b6`, `#fbb6ce`
- Viola: `#a855f7`, `#c084fc`, `#ddd6fe`
- Blu: `#3b82f6`, `#60a5fa`, `#93c5fd`

### Gradienti Utilizzati
- **Romantic**: Rosa → Viola → Blu
- **Sunset**: Rosa corallo → Rosa chiaro → Viola chiaro
- **Aurora**: Blu → Viola → Rosa → Corallo
- **Gentle**: Bianco → Viola tenuissimo → Bianco

Tutti gli elementi sono progettati per integrarsi armoniosamente con il tema esistente dell'app mantenendo l'usabilità e migliorando l'esperienza visiva.