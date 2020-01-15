const formatEventData = (eventData) => {
	eventData.actor = {};
	eventData.repo = {};
	eventData.actor.id = eventData.actor_id;
	eventData.actor.login = eventData.login;
	eventData.actor.avatar_url = eventData.avatar_url;
	eventData.repo.id = eventData.repo_id;
	eventData.repo.name = eventData.name;
	eventData.repo.url = eventData.url;
	delete eventData.actor_id;
	delete eventData.login;
	delete eventData.avatar_url;
	delete eventData.repo_id;
	delete eventData.name;
	delete eventData.url;
	delete eventData.repo_id;
	return eventData;
}

var getAllEvents = (req, res) => {
	// SQL query to get all Events
	const SQL = `
		SELECT events.*, actors.id AS actor_id, actors.login, actors.avatar_url, repos.id as repo_id, repos.url, repos.name
		FROM events
		INNER JOIN actors ON actors.id = events.actor_id
		INNER JOIN repos ON repos.id = events.repo_id
		ORDER BY id ASC
	`;
	req.dbConnection.all(SQL, function (err, data) {
		if (err) throw new Error(err);
		res.status(200).json(data.map(formatEventData));
	});
};

var addEvent = (req, res) => {
	// SQL query to add event
	// Check if event exists first
	const CHECK_SQL = `SELECT count(*) AS count FROM events WHERE id=${req.body.id}`;
	const INSERT_ACTOR_SQL = `REPLACE INTO actors (id, login, avatar_url) VALUES (?, ?, ?);`;
	const INSERT_REPO_SQL = `REPLACE INTO repos (id, name, url, actor_id) VALUES (?, ?, ?, ?);`;
	const INSERT_EVENT_SQL = `INSERT INTO events (id, type, created_at, actor_id, repo_id) VALUES (?, ?, ?, ?, ?);`;
	req.dbConnection.get(CHECK_SQL, function (err, { count }) {
		if (err) throw new Error(err);
		if (count > 0) return res.status(400).json({ status: false, error: 'Event already exists' });
		const { id, type, created_at, actor, repo } = req.body;
		req.dbConnection.run(INSERT_ACTOR_SQL, [actor.id, actor.login, actor.avatar_url])
			.run(INSERT_REPO_SQL, [repo.id, repo.name, repo.url, actor.id])
			.run(INSERT_EVENT_SQL, [id, type, created_at, actor.id, repo.id], function(error) {
				if (error) return res.status(500).json({ status: false, error: error.message });
				return res.status(201).json({ status: true });
			});
	});
};


var getByActor = (req, res) => {
	// SQL query to get events by actor id
	const SQL = `
		SELECT events.*, actors.id AS actor_id, actors.login, actors.avatar_url, repos.id as repo_id, repos.url, repos.name
		FROM events
		INNER JOIN actors ON actors.id = events.actor_id
		INNER JOIN repos ON repos.actor_id = events.actor_id	
		WHERE events.actor_id = ?
		ORDER BY id ASC
	`;
	req.dbConnection.all(SQL, [req.params.actorID], function (err, data) {
		if (err) throw new Error(err);
		if (!data) return res.status(404).json({ status: false, error: 'Actor has no events'});
		return res.status(200).json(data.map(formatEventData));
	});
};


var eraseEvents = (req, res) => {
	// SQL query to delete from multiple tables
	const SQL = `DELETE FROM events; DELETE FROM actors; DELETE FROM repos`;
	req.dbConnection.run(SQL, function (err) {
		if (err) throw new Error(err);
		res.status(200).json({});
	});
};

module.exports = {
	getAllEvents: getAllEvents,
	addEvent: addEvent,
	getByActor: getByActor,
	eraseEvents: eraseEvents
};
