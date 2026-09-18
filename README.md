# Snack Direct — POC Android

Petit point de vente Android sans backend : on sélectionne des produits dans un
menu JSON puis on imprime un ticket cuisine sur une imprimante thermique
Bluetooth Classic compatible ESC/POS.

## Ce que valide ce prototype

- menu, enseigne, devise et pied de ticket configurables dans `src/data/menu.json` ;
- panier local avec quantités et total ;
- liste des imprimantes déjà appairées à Android ;
- connexion Bluetooth puis ticket ESC/POS avec coupe papier ;
- aucune donnée réseau ou serveur.

## Démarrage

L'app utilise une bibliothèque native Bluetooth : elle ne peut donc pas tourner
dans Expo Go. Installer un development build sur une vraie tablette/téléphone Android :

```powershell
npx.cmd expo run:android
```

Pour les changements JavaScript/JSON ultérieurs :

```powershell
npx.cmd expo start --dev-client
```

## Test imprimante

1. Allumer l'imprimante ESC/POS et l'appairer une fois depuis les réglages Bluetooth Android.
2. Ouvrir l'app, toucher `Connecter imprimante`, puis `Afficher les imprimantes appairées`.
3. Choisir l'imprimante, ajouter des produits, puis `Valider & imprimer`.

Les tests doivent se faire sur un appareil physique : un émulateur Android ne
dispose généralement pas du Bluetooth Classic requis par une imprimante thermique.

## Limites du POC

- Android uniquement ;
- pas de persistance de panier ni de file de réimpression après fermeture de l'app ;
- le pilote suppose un modèle Bluetooth Classic / ESC-POS. Une imprimante BLE-only,
  Epson ePOS ou Star peut nécessiter son SDK constructeur.
