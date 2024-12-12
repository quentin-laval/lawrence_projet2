// Fonction pour supprimer le cookie et rediriger vers la page index.html
function disconnect() {
    // Supprimer le token du cookie en le définissant avec une date d'expiration passée
    document.cookie = "Projet_Lawrence_Token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  
    // Rediriger vers la page index.html
    window.location.href = 'index.html';
  }
  
  // Ajouter un écouteur d'événements au bouton d'id disconnect
  document.getElementById('disconnect').addEventListener('click', disconnect);
  