app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
      const result = await db.query(
          'INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4) RETURNING userid',
          [firstName, lastName, email, password]
      );
      res.status(201).json({ userId: result.rows[0].userid });
  } catch (error) {
      console.error('Error during query:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

// Post Lost and Found Items
app.post('/items', async (req, res) => {
  const { categoryID, ownerID, location, description, dateFound, status } = req.body;
  try {
      const result = await db.query(
          'INSERT INTO item (categoryid, ownerid, location, description, datefound, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING itemid',
          [categoryID, ownerID, location, description, dateFound, status]
      );
      res.status(201).json({ itemID: result.rows[0].itemid });
  } catch (error) {
      console.error('Error during query:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

// Get All Items
app.get('/items', async (req, res) => {
  try {
      const result = await db.query('SELECT * FROM item');
      res.status(200).json(result.rows);
  } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

// Match Items and Send Notifications
app.post('/match', async (req, res) => {
  const { description } = req.body;
  try {
      const result = await db.query('SELECT * FROM item WHERE description ILIKE $1', [`%${description}%`]);
      if (result.rows.length > 0) {
          for (const item of result.rows) {
              await db.query(
                  'INSERT INTO notification (userid, notificationtext, status) VALUES ($1, $2, $3)',
                  [item.ownerid, `Possible match for your lost item: ${item.description}`, 'unread']
              );
          }
          res.status(200).json({ message: 'Notifications sent' });
      } else {
          res.status(200).json({ message: 'No matches found' });
      }
  } catch (error) {
      console.error('Error during matching:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

// Get Notifications for a User
app.get('/notifications/:userID', async (req, res) => {
  const { userID } = req.params;
  try {
      const result = await db.query('SELECT * FROM notification WHERE userid = $1', [userID]);
      res.status(200).json(result.rows);
  } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

// Update Item Status
app.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
      const result = await db.query(
          'UPDATE item SET status = $1 WHERE itemid = $2 RETURNING *',
          [status, id]
      );
      res.status(200).json(result.rows[0]);
  } catch (error) {
      console.error('Error updating item status:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

// Delete Item
app.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
      await db.query('DELETE FROM item WHERE itemid = $1', [id]);
      res.status(204).send();
  } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
