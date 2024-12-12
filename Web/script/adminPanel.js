window.addEventListener('load', function () {
    const adminPanelDiv = document.getElementById('adminPanel');

    // Récupérer le token du cookie
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    const token = getCookie('Projet_Lawrence_Token');

    if (token) {
        // Envoyer le token au serveur pour vérifier les droits admin
        fetch('http://192.168.64.187/adminPanel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token }),
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Accès refusé ou token invalide.');
                }
            })
            .then(html => {
                // Insérer le HTML reçu dans la div adminPanel
                adminPanelDiv.innerHTML = html;
            })
            .catch(error => {
                adminPanelDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
            });
    } else {
        adminPanelDiv.innerHTML = `<p style="color: red;">Token manquant. Veuillez vous connecter.</p>`;
    }
});

// Fonction pour supprimer un compte
function deleteAccount(userId) {
    const token = document.cookie.split('; ').find(row => row.startsWith('Projet_Lawrence_Token=')).split('=')[1];

    fetch('http://192.168.64.187/deleteAccount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token, userId: userId }),
    })
        .then(response => response.text())
        .then(message => {
            alert(message);
            location.reload(); // Recharger la page après suppression
        });
}

// Fonction pour modifier un compte
function updateAccount(userId) {
    const token = document.cookie.split('; ').find(row => row.startsWith('Projet_Lawrence_Token=')).split('=')[1];

    const newUsername = document.getElementById(`username-${userId}`).value;
    const newEmail = document.getElementById(`email-${userId}`).value;

    fetch('http://192.168.64.187/updateAccount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token, userId: userId, newUsername: newUsername, newEmail: newEmail }),
    })
        .then(response => response.text())
        .then(message => {
            alert(message);
            location.reload(); // Recharger la page après modification
        });
}
