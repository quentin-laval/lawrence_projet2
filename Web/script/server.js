// Import required modules
const express = require('express');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const ejs = require('ejs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');


// Create an Express app
const app = express();
app.use(express.json());

// Set up middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up database connection
const db = {
  host: 'localhost',
  user: 'Lawrence_control',
  password: '951236874',
  database: 'Lawrence',
  port: 3306,
};

// Create a connection to the database
const mysql = require('mysql');
const { connect } = require('ngrok');
const connection = mysql.createConnection(db);

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('error connecting:', err);
    return;
  }
  console.log("Connectée en tant qu'id de thread numéro : " + connection.threadId);
});

// Register route
app.post('/register', (req, res) => {
  console.log("Alerte : Requête register reçu");
  try {
    const { user, email, password } = req.body;
    console.log(req.body);
    if (!user || !email || !password) {
      return res.status(400).send({ message: 'User, email, and password are required', errorCode: 'REGISTER_MISSING_FIELDS' });
    }

    const emailQuery = 'SELECT * FROM User WHERE email = ?';
    connection.query(emailQuery, [email], (err, results) => {
      console.log("recherche de mail, user");
      if (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error checking email', errorCode: 'REGISTER_EMAIL_CHECK_FAILED' });
      }

      if (results.length > 0) {
        return res.status(400).send({ message: 'Email is already in use', errorCode: 'REGISTER_EMAIL_IN_USE' });
        console.log("Mail taken");
      }

      const userQuery = 'SELECT * FROM User WHERE user = ?';
      connection.query(userQuery, [user], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send({ message: 'Error checking username', errorCode: 'REGISTER_USERNAME_CHECK_FAILED' });
          console.log("Fail");
        }

        if (results.length > 0) {
          return res.status(400).send({ message: 'Username is already taken', errorCode: 'REGISTER_USERNAME_TAKEN' });
          console.log("Username taken");
        }

        const hashedPassword = hashPassword(password);
        const token = randomToken();
        console.log(`Generated token: ${token}`);

        const insertQuery = 'INSERT INTO User (user, email, password, token, isAdmin) VALUES (?, ?, ?, ?, ?)';
        connection.query(insertQuery, [user, email, hashedPassword, token, 0], (err, results) => {
          if (err) {
            console.error(err);
            return res.status(500).send({ message: 'Error registering user', errorCode: 'REGISTER_FAILED' });
            console.log("Error");
          }

          console.log(`User ${user} registered successfully with token ${token}`);
          res.send({ message: 'User registered successfully', token });
        });
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send({ message: 'Internal server error', errorCode: 'INTERNAL_SERVER_ERROR' });
  }
});

// Login route (with detailed console logs)
app.post('/login', async (req, res) => {
  console.log("Login request received");
  console.log("Request body:", req.body); // Log the entire request body

  const { user, email, password } = req.body;

  if ((!user && !email) || !password) {
    console.log("Missing username/email or password");
    return res.status(400).json({ error: 'Username or email and password are required' });
  }

  try {
    let query = 'SELECT * FROM User WHERE ';
    let params;

    if (user) {
      query += 'user = ?';
      params = [user];
      console.log("Looking for user by username:", user);
    } else {
      query += 'email = ?';
      params = [email];
      console.log("Looking for user by email:", email);
    }

    // Log the SQL query and parameters
    console.log("SQL query:", query);
    console.log("SQL params:", params);

    // Execute the query
    connection.query(query, params, async (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Log the result from the database query
      console.log("Query result:", result);

      if (result.length === 0) {
        console.log("No user found with the provided username/email");
        return res.status(401).json({ error: 'User not found' });
      }

      const user = result[0];
      console.log("User found:", user);

      // Log password comparison operation
      console.log("Comparing passwords...");
      const isValidPassword = await bcrypt.compare(password, user.password);

      // Log the result of password comparison
      console.log("Password comparison result:", isValidPassword);

      if (!isValidPassword) {
        console.log("Invalid password");
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Log token being sent back to the client
      console.log("Login successful, sending token:", user.token);
      res.json({ uniqueToken: user.token });
    });
  } catch (error) {
    console.error('Internal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/adminPanel', (req, res) => {
  const token = req.body.token;
  console.log(token);

  // Vérifier si le token existe dans la base de données
  connection.query('SELECT * FROM User WHERE token = ?', [token], (err, result) => {
    if (err) throw err;

    // Si le token est trouvé
    if (result.length > 0) {
      const user = result[0];

      // Vérifier si l'utilisateur est un administrateur
      if (user.isAdmin === 1) {

        // Récupérer tous les comptes pour les afficher dans le panel
        connection.query('SELECT * FROM User', (err, accounts) => {
          if (err) throw err;

          // Générer le HTML du panel admin
          let adminPanelHTML = `
            <div id="adminPanel">
              <h1>Admin Panel</h1>
              <table>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>`;

          // Pour chaque compte, ajouter une ligne avec des boutons pour modifier/supprimer
          accounts.forEach(account => {
            adminPanelHTML += `
              <tr>
                <td>${account.ID}</td>
                <td><input type="text" value="${account.user}" id="username-${account.ID}" /></td>
                <td><input type="email" value="${account.email}" id="email-${account.ID}" /></td>
                <td>
                  <button onclick="updateAccount(${account.ID})">Modifier</button>
                  <button onclick="deleteAccount(${account.ID})">Supprimer</button>
                </td>
              </tr>`;
          });

          adminPanelHTML += `</table></div>`;

          // Envoyer le panel admin en réponse
          res.send(adminPanelHTML);
        });
      } else {
        // Si l'utilisateur n'est pas admin, renvoyer une erreur
        res.status(403).send('Accès refusé.');
      }
    } else {
      // Si le token n'est pas trouvé
      res.status(401).send('Token invalide.');
      console.log("Token Invalide détected");
    }
  });
});

// Route pour supprimer un compte
app.post('/deleteAccount', (req, res) => {
  const { token, userId } = req.body;

  // Vérifier que l'utilisateur est admin
  connection.query('SELECT * FROM User WHERE token = ?', [token], (err, result) => {
    if (err) throw err;

    if (result.length > 0 && result[0].isAdmin === 1) {
      // Supprimer le compte
      connection.query('DELETE FROM User WHERE id = ?', [userId], (err, result) => {
        if (err) throw err;
        res.send('Compte supprimé avec succès.');
      });
    } else {
      res.status(403).send('Action refusée.');
    }
  });
});

// Route pour modifier un compte (username et email)
app.post('/updateAccount', (req, res) => {
  const { token, userId, newUsername, newEmail } = req.body;
  console.log("Update : ", userId, token)

  // Vérifier que l'utilisateur est admin
  connection.query('SELECT * FROM User WHERE token = ?', [token], (err, result) => {
    if (err) throw err;

    if (result.length > 0 && result[0].isAdmin === 1) {
      // Mettre à jour le compte
      connection.query('UPDATE User SET user = ?, email = ? WHERE id = ?', [newUsername, newEmail, userId], (err, result) => {
        if (err) throw err;
        res.send('Compte modifié avec succès.');
      });
    } else {
      res.status(403).send('Action refusée.');
    }
  });
});


// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send({ message: 'Internal server error', errorCode: 'INTERNAL_SERVER_ERROR' });
});


// Function to hash the password using bcrypt
function hashPassword(password) {
  const bcrypt = require('bcrypt');
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

function randomToken() {
  // Générer une série de nombres aléatoires entre 50 et 60
  const length = Math.floor(Math.random() * 11) + 50; // Générer une longueur aléatoire entre 50 et 60
  let randomNumbers = '';

  // Générer chaque nombre aléatoire et le convertir en hexadécimal
  for (let i = 0; i < length; i++) {
    const randomNumber = Math.floor(Math.random() * 256); // Générer un nombre entre 0 et 255
    randomNumbers += randomNumber.toString(16).padStart(2, '0'); // Convertir en hexadécimal
  }

  // Retourner la série de nombres en hexadécimal en tant que chaîne
  return randomNumbers;
}
// Exemple d'utilisation
console.log(randomToken());



// Log messages for debugging purposes
console.log('Register route initialized');
console.log('Login route ini  tialized')

// Start the server
const port = 5560;
app.listen(port, () => {
  console.log(`Serveur lancée sur le port : ${port}`);
});

