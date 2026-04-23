# B20 Control

Controleur natif macOS pour le micro EPOS B20, developpe sans SDK officiel par reverse engineering des signaux HID USB.

## Materiel
- Produit : EPOS B20 Streaming Microphone
- Vendor ID : 5013 (0x1395)
- Product ID : 159 (0x009F)
- Serie : A003420211605453
- Interface HID active : usagePage 12
- Interface HID proprietaire : usagePage 65485 - inaccessible sans SDK EPOS

## Decodage HID - Carte des signaux

80 01 YY ff  -> Gain micro (valeur absolue 0-24, knob arriere)
80 02 00 ff  -> Mute OFF (voyant blanc, micro actif)
80 02 01 ff  -> Mute ON (voyant rouge, micro mute)
03 02 / 03 00 -> Volume casque + (encodeur sens horaire)
03 01 / 03 00 -> Volume casque - (encodeur sens anti-horaire)
80 03 01 ff  -> Pattern Cardioid
80 03 02 ff  -> Pattern Stereo
80 03 03 ff  -> Pattern Bidirectionnel
80 03 04 ff  -> Pattern Omnidirectionnel

Notes importantes :
- Le B20 nenvoie pas son etat au demarrage
- Le volume casque est un encodeur infini, pas de valeur absolue
- Le gain fin DSP est dans la couche proprietaire inaccessible
- usagePage 65485 contient probablement EQ, noise gate, noise cancellation

## Architecture actuelle

main.js        - Point entree Electron, HID, Tray, notifications
index.html     - Interface complete HTML CSS JS inline
icon.png       - Icone source 1024x1024
icon.icns      - Icone macOS compilee
icon.iconset/  - Toutes les tailles icone
entitlements.mac.plist - Permissions macOS
package.json   - Configuration Electron Builder
dist/          - App compilee et DMG

Problemes architecture actuelle :
- Tout le code HID, tray et etat dans main.js
- Interface HTML CSS JS dans un seul fichier
- Pas de separation des responsabilites
- Pas de gestion etat centralisee

## Architecture cible

main.js                 - Point entree uniquement
src/
  hid.js               - Connexion et decodage HID B20
  tray.js              - Barre de menu et menu contextuel
  notifications.js     - Toutes les notifications macOS
  state.js             - Etat global centralise
renderer/
  index.html           - Structure HTML uniquement
  app.js               - Logique interface
  style.css            - Styles separes
assets/
  icon.png
  icon.icns

## Fonctionnalites v1.0.0

- Detection automatique B20 via USB HID
- Statut mute en temps reel avec voyant anime
- Gain micro avec barre orange 0-100%
- Volume casque avec encodeur relatif
- Pattern pickup detecte dynamiquement
- VU-metre audio temps reel (fige quand mute)
- Historique horodate des actions
- Icone barre de menu avec statut permanent
- Menu clic droit Ouvrir / Quitter
- Notification connexion et deconnexion
- Reconnexion automatique si cable debranche
- Interface grisee quand deconnecte
- Numero de serie affiche
- App signee certificat Apple Developer
- DMG installable arm64

## Roadmap

v1.1.0 - Restructuration
- Separer code en modules hid.js tray.js state.js
- Separer HTML CSS JS
- Architecture propre et maintenable

v2.0.0 - HIDScope
- Generaliser pour tout peripherique USB HID
- Detection automatique et decodage assiste par IA Gemini
- Generation interface dynamique selon peripherique
- Partage de profils entre utilisateurs

## Stack technique

- Electron 41.2.2
- node-hid communication USB HID
- Web Audio API VU-metre
- electron-builder packaging et signature
- Plateforme macOS Apple Silicon arm64
- Certificat Developer ID Application Stephane SAULNIER G4U9RG5GL7

## Notes developpement

- Les sed avec emojis causent des blocages - toujours reecrire fichiers complets avec cat
- Couche HID proprietaire usagePage 65485 necessite SDK EPOS
- B20 arrete par EPOS gamme gaming abandonnee - EPOS Gaming Suite plus maintenue

B20 Control - Developpe en une nuit, avril 2026
