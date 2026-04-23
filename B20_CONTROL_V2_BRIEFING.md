# B20 Control v2.0 - Briefing restructuration

## Objectif

Restructurer B20 Control v1.0.0 en architecture propre MVVM avec separation complete des responsabilites. Le comportement et les fonctionnalites restent identiques - seule l architecture change.

## Ce qui existe - v1.0.0

Deux fichiers monolithiques :
- main.js : 150 lignes melant HID, tray, notifications, etat, logique
- index.html : HTML CSS JS tout inline, pas de separation

Problemes identifies :
- Impossible de modifier une fonctionnalite sans risquer den casser une autre
- Les sed avec emojis cassent le fichier - preuve de fragilite
- Pas testable, pas maintenable, pas extensible vers HIDScope

## Architecture cible MVVM

epos-b20-controller/
  main.js                    - Point entree Electron UNIQUEMENT
  src/
    model/
      device.js              - Modele du peripherique B20
      state.js               - Etat global centralise et observable
      profile.js             - Profil JSON du B20
    view/
      tray.js                - Vue barre de menu
      notifications.js       - Vue notifications macOS
    viewmodel/
      device-vm.js           - ViewModel connexion HID et reconnexion
      controls-vm.js         - ViewModel decodage signaux et mise a jour etat
      audio-vm.js            - ViewModel VU-metre
  renderer/
    index.html               - Structure HTML uniquement, pas de logique
    app.js                   - ViewModel renderer, ecoute ipcRenderer
    style.css                - Tous les styles separes
    components/
      mute-card.js           - Composant carte mute
      gain-card.js           - Composant carte gain
      volume-card.js         - Composant carte volume
      pattern-card.js        - Composant carte pattern
      vu-meter.js            - Composant VU-metre
      history.js             - Composant historique
  assets/
    icon.icns
    icon.png
    icon.iconset/
  profiles/
    epos-b20.json            - Profil complet du B20
  entitlements.mac.plist
  package.json
  README.md

## Responsabilites de chaque fichier

main.js
- Creer la fenetre Electron
- Creer le tray
- Lancer le ViewModel device
- Masquer le dock
- Gerer will-quit
- RIEN D AUTRE

src/model/state.js
- Objet central : gain, mute, volume, pattern, isConnected, serial
- Emetteur d evenements quand l etat change
- Jamais modifie directement - passe par les ViewModels

src/model/device.js
- Constantes du B20 : vendorId, productId, usagePage
- Methode de decodage des signaux bruts vers evenements semantiques
- Pure logique, pas de side effects

src/model/profile.js
- Charge et expose le profil JSON du B20
- Types de controles, labels, couleurs, min max

src/viewmodel/device-vm.js
- Connexion HID et gestion deconnexion
- Reconnexion automatique toutes les 3 secondes
- Appelle device.js pour decoder les signaux
- Met a jour state.js
- Envoie les evenements au renderer via ipcMain

src/viewmodel/controls-vm.js
- Traduit les evenements HID en mises a jour etat
- Calcule les pourcentages et labels
- Orchestre les notifications et le tray

src/viewmodel/audio-vm.js
- Gere le stream audio Web Audio API
- Calcule le niveau en dB
- Envoie les donnees au renderer

src/view/tray.js
- Construit et met a jour le titre du tray
- Construit le menu contextuel
- Ecoute les changements de state.js

src/view/notifications.js
- Toutes les notifications macOS
- Connexion, deconnexion, mute, unmute

renderer/app.js
- Ecoute tous les evenements ipcRenderer
- Met a jour les composants
- Pas de logique metier

renderer/components/*.js
- Chaque composant gere son propre DOM
- Methode update(value) pour recevoir les mises a jour
- Methode render() pour initialiser

renderer/style.css
- Tous les styles actuels de index.html extraits
- Variables CSS pour les couleurs
- Pas de styles inline

profiles/epos-b20.json
{
  vendorId: 5013,
  productId: 159,
  name: EPOS B20,
  manufacturer: EPOS,
  hidInterface: 12,
  serialNumber: A003420211605453,
  controls: [
    { id: gain, label: Gain micro, type: absolute-encoder, signal: 80-01-YY-ff, min: 0, max: 24, color: orange },
    { id: mute, label: Statut micro, type: toggle, signalOn: 80-02-01-ff, signalOff: 80-02-00-ff },
    { id: volume, label: Volume casque, type: relative-encoder, signalUp: 03-02, signalDown: 03-01, color: blue },
    { id: pattern, label: Pattern pickup, type: selector, signals: { 1: 80-03-01-ff, 2: 80-03-02-ff, 3: 80-03-03-ff, 4: 80-03-04-ff }, options: { 1: Cardioid, 2: Stereo, 3: Bidirectionnel, 4: Omnidirectionnel } }
  ]
}

## Plan de travail - prochaine session

Etape 1 - Creer la structure des dossiers vide
Etape 2 - Extraire state.js depuis main.js actuel
Etape 3 - Extraire device.js avec le decodage HID
Etape 4 - Creer device-vm.js avec la connexion HID
Etape 5 - Creer tray.js et notifications.js
Etape 6 - Extraire style.css depuis index.html
Etape 7 - Creer les composants renderer
Etape 8 - Creer app.js renderer
Etape 9 - Nettoyer main.js pour qu il ne reste que le strict minimum
Etape 10 - Tester avec npm start
Etape 11 - Creer epos-b20.json
Etape 12 - Builder et verifier que tout est identique a v1.0.0

## Regles de developpement

- Toujours creer les fichiers avec cat et ENDOFFILE
- Jamais de sed avec emojis
- Tester npm start apres chaque etape
- Ne jamais casser une fonctionnalite existante
- Commiter apres chaque etape qui fonctionne

## Fonctionnalites a conserver identiques

- Detection automatique B20 via USB HID
- Statut mute en temps reel avec voyant anime
- Gain micro barre orange 0-100%
- Volume casque encodeur relatif
- Pattern pickup detecte dynamiquement
- VU-metre audio temps reel fige quand mute
- Historique horodate
- Tray avec statut gain pattern en permanence
- Menu clic droit Ouvrir Quitter
- Notifications connexion deconnexion mute
- Reconnexion automatique
- Interface grisee quand deconnecte
- Numero de serie affiche
- Icone B20 Control

## Rappel signaux HID B20

80 01 YY ff  -> Gain micro valeur absolue 0-24
80 02 00 ff  -> Mute OFF voyant blanc
80 02 01 ff  -> Mute ON voyant rouge
03 02 03 00  -> Volume casque plus
03 01 03 00  -> Volume casque moins
80 03 01 ff  -> Pattern Cardioid
80 03 02 ff  -> Pattern Stereo
80 03 03 ff  -> Pattern Bidirectionnel
80 03 04 ff  -> Pattern Omnidirectionnel

B20 Control v2.0 - Restructuration MVVM - Steve et Claude
