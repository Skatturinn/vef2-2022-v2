import { error } from 'console';
import { readFile } from 'fs/promises';
import pg from 'pg';

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';

const { DATABASE_URL: connectionString, NODE_ENV: nodeEnv = 'development' } =
	process.env;

if (!connectionString) {
	console.error('vantar DATABASE_URL í .env');
	process.exit(-1);
}

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development
// mode, á heroku, ekki á local vél
const ssl = nodeEnv === 'production' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
	console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
	process.exit(-1);
});

export async function query(q, values = []) {
	let client;
	try {
		client = await pool.connect();
	} catch (e) {
		console.error('unable to get client from pool', e);
		return null;
	}

	try {
		const result = await client.query(q, values);
		return result;
	} catch (e) {
		if (nodeEnv !== 'test') {
			console.error('unable to query', e);
		}
		return null;
	} finally {
		client.release();
	}
}

export async function createSchema(schemaFile = SCHEMA_FILE) {
	const data = await readFile(schemaFile);

	return query(data.toString('utf-8'));
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
	const data = await readFile(dropFile);

	return query(data.toString('utf-8'));
}

export async function end() {
	await pool.end();
}

/* TODO útfæra aðgeðir á móti gagnagrunni */
export async function listEvents() {
	const q = `
	  SELECT
		id, name, slug, description, created, updated
	  FROM
		events
	`;

	const result = await query(q);

	if (result) {
		return result.rows;
	}

	return null;
}

export async function listEvent(slug) {
	const q = `
	SELECT
		id, name, slug, description, location, url, created, updated
	FROM
		events
	WHERE slug = $1
	`;

	const result = await query(q, [slug]);
	if (result && result.rowCount === 1) {
		return result.rows[0];
	}

	return null // gekk ekki
}

export async function listRegistered(event) {
	const q = `
	  SELECT
		id, name, comment
	  FROM
		registrations
	  WHERE event = $1
	`;

	const result = await query(q, [event]);

	if (result) {
		return result.rows;
	}

	return null;
}
// skráir þig á viðburð
export async function register({ name, comment, event } = {}) {
	const q = `
	  INSERT INTO registrations
		(name, comment, event)
	  VALUES
		($1, $2, $3)
	  RETURNING
		id, name, comment, event;
	`;
	let b = true;
	const arr = await listRegistered(event)
	arr.forEach(element => {
		if (element.name === name) {
			b = false
		}
	});
	if (b) {
		const values = [name, comment, event];
		const result = await query(q, values);
		if (result && result.rowCount === 1) {
			return result.rows[0];
		}
	}
	throw new Error('Notandi núþegar skráður')

}
// export async function unregister({ name, event } = {}) {
// 	const q = `
// 		DELETE FROM registrations
// 		WHERE name = $1 AND event = $2
// 	`
// 	const values = [name, event];
// 	const result = await query(q, values);
// 	return result?.rowCount
// }
export async function unregister({ name, event } = {}) {
	let values;
	let q;
	if (name) {
		q = `
		DELETE FROM registrations
		WHERE name = $1 AND event = $2
	  `;
		values = [name, event];
	} else {
		q = `
		DELETE FROM registrations
		WHERE event = $1
	  `;
		values = [event]
	}

	try {
		const result = await query(q, values);
		return result?.rowCount
	} catch (error) {
		console.error('Error during unregister:', error.message);
		return null;
	}
}
// export async function deleteEvent({ event } = {}) {
// 	await unregister({ name: false, event })
// 	const q = `
// 	  DELETE FROM events
// 	  WHERE slug = $1
// 	`;
// 	const values = [event];
// 	try {
// 		const result = await query(q, values);
// 		return result?.rowCount
// 	} catch (err) {
// 		console.error('Error during unregister:', err.message);
// 		return null;
// 	}
// }
export async function deleteEvent(id) {
	await unregister({ name: false, event: id })
	const q = `
	  DELETE FROM events
	  WHERE id = $1;
	`;
	const values = [id]
	const result = await query(q, values);
	if (result && result.rowCount === 1) {
		return result.rows[0];
	}

	return null;
}

export async function createEvent({ name, slug, description, location, url } = {}) {
	const q = `
	  INSERT INTO events
		(name, slug, description, location, url)
	  VALUES
		($1, $2, $3, $4, $5)
	  RETURNING id, name, slug, description, location, url;
	`;
	const values = [name, slug, description, location, url];
	const result = await query(q, values);
	if (result && result.rowCount === 1) {
		return result.rows[0];
	}

	return null;
}
// export async function deleteEvent(id) {
// 	const q = `
// 	  DELETE FROM events
// 	  WHERE id = $1;
// 	`;
// 	const result = await query(q, id);
// 	if (result && result.rowCount === 1) {
// 		return result.rows[0];
// 	}

// 	return null;
// }
export async function listEventByName(name) {
	const q = `
	  SELECT
		id, name, slug, description, created, updated
	  FROM
		events
	  WHERE name = $1
	`;

	const result = await query(q, [name]);

	if (result && result.rowCount === 1) {
		return result.rows[0];
	}

	return null;
}

// Updatear ekki description, erum ekki að útfæra partial update
export async function updateEvent(id, { name, slug, description } = {}) {
	const q = `
	  UPDATE events
		SET
		  name = $1,
		  slug = $2,
		  description = $3,
		  updated = CURRENT_TIMESTAMP
	  WHERE
		id = $4
	  RETURNING id, name, slug, description;
	`;
	const values = [name, slug, description, id];
	const result = await query(q, values);

	if (result && result.rowCount === 1) {
		return result.rows[0];
	}

	return null;
}