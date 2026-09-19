# Khedma Mobile

App mobile (React Native + Expo Router) de la marketplace **Khedma** — même backend, même modèle de données que le [dépôt web](https://github.com/Riadh-Hanachi/khedma), une seule app pour les deux rôles (client et prestataire).

## Démarrer

1. Le backend Khedma doit tourner (voir le [dépôt web](https://github.com/Riadh-Hanachi/khedma) pour l'installation) : `http://localhost:3001/api/v1`.
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Lancer l'app :
   ```bash
   npx expo start
   ```
   Puis choisir web (`w`), un émulateur Android/iOS, ou scanner le QR code avec [Expo Go](https://expo.dev/go).

L'URL de l'API est définie dans `app.json` (`expo.extra.apiUrl`), par défaut `http://localhost:3001/api/v1`. Sur un appareil physique ou un émulateur Android, remplacer `localhost` par l'IP de la machine hébergeant le backend (ou `10.0.2.2` pour l'émulateur Android).

## Périmètre

Réutilise directement l'API REST du backend NestJS (JWT, mêmes endpoints que le web) — aucune API mobile-spécifique.

- **Authentification** : connexion/inscription (sélection pays/catégorie), déconnexion.
- **Navigation par onglets adaptée au rôle** : client (Accueil/Rechercher/Mes demandes/Réservations/Messages/Profil), prestataire (Accueil/Demandes/Mes services/Réservations/Messages/Profil).
- **Client** : recherche filtrée, profil prestataire public avec réservation (crédit fidélité, code promo, devise dynamique selon le pays), demandes de service (assistant IA de rédaction, matching de prestataires, devis reçus), fidélité & parrainage, promotions.
- **Prestataire** : gestion des services (CRUD), feed des demandes ouvertes, envoi de devis (assistant IA de brouillon), réservations avec transitions de statut, documents de vérification (upload fichier), abonnement.
- **Messagerie temps réel** : Socket.IO (même gateway que le web), vérifiée avec un aller-retour de message sans rafraîchissement manuel.

## Non couvert dans cette première version

- Notifications push
- Build natif signé (testé jusqu'ici via Expo web et Expo Go, pas encore sur un store)
- Écrans avoués hors périmètre du web MVP (mode B2B avancé, équipe/techniciens, admin)

## Stack technique

- Expo (React Native) + Expo Router (routing par fichiers, comme l'App Router de Next.js côté web)
- TypeScript strict
- AsyncStorage pour la persistance du token JWT et du pays sélectionné
- socket.io-client pour la messagerie temps réel
- `@react-native-picker/picker` pour les sélecteurs (pays, catégorie)
- `expo-document-picker` pour l'upload de documents de vérification
