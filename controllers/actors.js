
var getAllActors = (req, res) => {
	// SQL query to get all actors
	const SQL = `
		SELECT actors.id, actors.login, actors.avatar_url, created_at, count(events.id) AS event_count FROM actors
		INNER JOIN events ON events.actor_id = actors.id
		GROUP BY login
		ORDER BY event_count DESC, created_at DESC, login DESC;
	`;
	req.dbConnection.all(SQL, function (err, data) {
		if (err) throw new Error(err);
		res.status(200).json(data.map(d => {
			delete d.event_count;
			delete d.created_at
			return d;
		}));
	});
};

var updateActor = (req, res) => {
	// SQL query to update actor
	const SQL = `UPDATE actors SET avatar_url = ? WHERE id = ?`;
	req.dbConnection.run(SQL, [req.body.avatar_url, req.body.id], function (err, data) {
		if (err) throw new Error(err);
		if (!this.changes) return res.status(404).json({});
		res.status(200).json({});
	});
};

var getStreak = (req, res) => {
	// SQL query to get streak
	const SQL = `
		SELECT events.*, actors.login FROM events
		LEFT JOIN actors on events.actor_id = actors.id
		ORDER BY created_at DESC;
	`;
	req.dbConnection.all(SQL, function (err, events) {
		if (err) throw new Error(err);
		const streakOrderMap = {};
		for(let event of events) {
			if (streakOrderMap[event.actor_id]) {
				const prevDate = new Date(event.created_at);
				const currentDate = new Date(streakOrderMap[event.actor_id].lastEvent);
				
				// time difference
				const timeDiff = Math.abs(prevDate.getTime() - currentDate.getTime());
				// days difference
				const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
				
				if (diffDays < 2) {
					// consecutive
					streakOrderMap[event.actor_id].currentStreak++;
					if (streakOrderMap[event.actor_id].currentStreak > 	streakOrderMap[event.actor_id].maxStreak) {
						streakOrderMap[event.actor_id].maxStreak = streakOrderMap[event.actor_id].currentStreak;
					}
				} else {
					streakOrderMap[event.actor_id].currentStreak = 1;
				}
				streakOrderMap[event.actor_id].lastEvent = event.created_at;
			} else {
				streakOrderMap[event.actor_id] = {
					lastEvent: event.created_at,
					currentStreak: 1,
					maxStreak: 1,
					login: event.login,
				}
			}
		}

		const orderActorIds = Object.keys(streakOrderMap).sort((a, b) => {
			if (streakOrderMap[a].maxStreak === streakOrderMap[b].maxStreak && streakOrderMap[a].lastEvent === streakOrderMap[b].lastEvent)
				return streakOrderMap[a].login < streakOrderMap[b].login;
			if (streakOrderMap[a].maxStreak === streakOrderMap[b].maxStreak)
				return streakOrderMap[a].lastEvent < streakOrderMap[b].lastEvent;
			return streakOrderMap[a].maxStreak < streakOrderMap[b].maxStreak;
		});

		const ACTOR_QUERY = `SELECT * FROM actors WHERE id IN (${orderActorIds.join(', ')})`;

		req.dbConnection.all(ACTOR_QUERY, function (err, actors) {
			if (err) throw new Error(err);
			const orderedActors = orderActorIds.map(id => actors.find(a => a.id == id));
			return res.json(orderedActors);
		});
	});
};


module.exports = {
	updateActor: updateActor,
	getAllActors: getAllActors,
	getStreak: getStreak
};
