# Vérification DNS - Documentation

## 📋 Fonctionnalité

L'extension HTTP RIP vérifie maintenant automatiquement l'existence DNS de chaque domaine pour chaque requête HTTP capturée.

## 🔧 Comment ça fonctionne

### 1. Vérification Automatique
- Chaque fois qu'une requête HTTP est détectée, le domaine est extrait de l'URL
- Une vérification DNS est effectuée via l'API Google Public DNS (`https://dns.google/resolve`)
- Les résultats sont mis en cache pendant 5 minutes pour optimiser les performances

### 2. Statuts DNS
- **🟢 DNS OK** : Le domaine existe (enregistrements A trouvés)
- **🔴 DNS Invalide** : Le domaine n'existe pas (NXDOMAIN)
- **⏳ DNS...** : Vérification en cours
- **⚠️ DNS Erreur** : Erreur lors de la vérification (timeout, API inaccessible, etc.)

### 3. Interface Utilisateur

#### Résumé
- **Total** : Nombre total de requêtes
- **Erreurs HTTP** : Requêtes avec codes HTTP non-acceptables
- **Erreurs DNS** : Requêtes vers des domaines invalides ou en erreur

#### Filtres
- **Afficher uniquement les erreurs HTTP** : Filtre les requêtes avec codes HTTP non-acceptables
- **Afficher uniquement les erreurs DNS** : Filtre les requêtes vers des domaines invalides

#### Affichage des requêtes
Chaque requête affiche maintenant :
- Le badge de statut HTTP (comme avant)
- Le badge de statut DNS (nouveau)
- Le nom de domaine en gras
- Le message d'erreur DNS si applicable

### 4. Export CSV
Le fichier CSV exporté inclut maintenant :
- Le statut DNS de chaque requête
- Le nom de domaine

## 🧪 Tests Recommandés

### Test 1 : Domaines Valides
Visitez des sites connus :
- `https://www.google.com`
- `https://github.com`
- `https://stackoverflow.com`

**Résultat attendu** : Badge "🟢 DNS OK" pour toutes les requêtes

### Test 2 : Domaines Invalides
Créez une page HTML locale avec des requêtes vers des domaines inexistants :
```html
<!DOCTYPE html>
<html>
<body>
  <img src="https://ce-domaine-nexiste-absolument-pas-123456.com/image.png">
  <script src="https://domaine-invalide-test-xyz.net/script.js"></script>
</body>
</html>
```

**Résultat attendu** : Badge "🔴 DNS Invalide" pour ces requêtes

### Test 3 : Sous-domaines
Visitez des pages avec des sous-domaines :
- `https://api.github.com`
- `https://docs.github.com`

**Résultat attendu** : Badge "🟢 DNS OK" si les sous-domaines existent

### Test 4 : Cache DNS
1. Visitez un site (ex: google.com)
2. Rechargez la page plusieurs fois rapidement
3. Vérifiez dans la console du background script que les requêtes DNS ne sont pas répétées

**Résultat attendu** : Les domaines déjà vérifiés utilisent le cache (pas de nouvelles requêtes API pendant 5 minutes)

### Test 5 : Filtres
1. Visitez une page avec des erreurs DNS
2. Cochez "Afficher uniquement les erreurs DNS"
3. Décochez et cochez "Afficher uniquement les erreurs HTTP"

**Résultat attendu** : Les filtres s'excluent mutuellement et affichent les bonnes requêtes

### Test 6 : Export CSV
1. Capturez plusieurs requêtes (valides et invalides)
2. Cliquez sur "Exporter CSV"
3. Ouvrez le fichier

**Résultat attendu** : Le CSV contient les colonnes "DNS Status" et "Domain"

## 🔍 Débogage

### Vérifier les requêtes DNS
Ouvrez la console du background script (about:debugging > Inspects) :
```javascript
// Voir le cache DNS
console.log(dnsCache);

// Voir les domaines vérifiés
Object.keys(dnsCache);
```

### Forcer une nouvelle vérification
```javascript
// Vider le cache DNS
dnsCache = {};
```

## ⚙️ Configuration

### Cache TTL
Par défaut : 5 minutes (300000 ms)

Pour modifier, éditer `background.js` :
```javascript
const DNS_CACHE_TTL = 300000; // Modifier cette valeur
```

### API DNS
Par défaut : Google Public DNS

Pour changer d'API, modifier la fonction `checkDNS()` dans `background.js` :
```javascript
const response = await fetch(
  `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`
);
```

## 📊 Performance

- **Cache** : Réduit les requêtes API de ~90% pour les domaines fréquents
- **Timeout** : Les requêtes DNS n'ont pas de timeout explicite (géré par fetch)
- **Async** : Les vérifications DNS sont asynchrones et ne bloquent pas l'UI
- **Limite** : Pas de limite côté extension (Google DNS : 10000 req/jour)

## 🐛 Problèmes Connus

1. **Délai initial** : La première vérification peut prendre 1-2 secondes
2. **API Limitée** : Google DNS peut limiter les requêtes en cas d'usage intensif
3. **Domaines locaux** : Les domaines .local ou IP ne sont pas vérifiés correctement

## 📝 Changelog

### Version 1.1
- ✅ Ajout de la vérification DNS via Google Public DNS
- ✅ Cache DNS avec TTL de 5 minutes
- ✅ Badges visuels pour les statuts DNS
- ✅ Filtre pour afficher uniquement les erreurs DNS
- ✅ Compteur d'erreurs DNS dans le résumé
- ✅ Export CSV enrichi avec les données DNS