import express from 'express';
import { validationResult } from 'express-validator';
import passport from 'passport';
import { catchErrors } from '../lib/catch-errors.js';
import { listEvents, listEvent, listRegistered, register, unregister } from '../lib/db.js';
import {
	registrationValidationMiddleware,
	sanitizationMiddleware,
	userRegistrationValidationMiddleware,
	userSanitizationMiddleware,
	userXssSanitizationMiddleware,
	xssSanitizationMiddleware,
} from '../lib/validation.js';
import { createUser } from '../lib/users.js';

export const indexRouter = express.Router();

function una(req) {
	const { user: { username, admin } = {} } = req || {};
	return { username, admin };
}

async function indexRoute(req, res) {
	const events = await listEvents();
	const { username, admin } = una(req)
	const auth = req.isAuthenticated();
	const { query } = req;
	const p = query?.p || 1
	return res.render('index', {
		username,
		events,
		errors: [],
		data: {},
		title: 'Viðburðir — umsjón',
		admin,
		auth,
		p
	});
}

async function eventRoute(req, res, next) {
	const { slug } = req.params;
	const event = await listEvent(slug);
	if (!event) {
		return next()
	}
	const auth = req.isAuthenticated();
	const { username, admin } = una(req)
	const registered = await listRegistered(event.id);
	let err = false;
	if (auth) {
		err = registered.some(element => element.name === username);
	}
	return res.render('event', {
		title: `${event.name} — Viðburðasíðan`,
		event,
		registered,
		errors: [],
		data: {},
		admin,
		auth,
		username,
		err
	});
}

async function validationCheck(req, res, next) {
	const { comment } = req.body;
	// const name = req.user.username
	const auth = req.isAuthenticated();

	// TODO tvítekning frá því að ofan
	const { slug } = req.params;
	const event = await listEvent(slug);
	const registered = await listRegistered(event.id);
	// if (comment) {
	// 	const registered = await listRegistered(event.id);
	// }
	// const registered = await listRegistered(event.id);
	const { username, admin } = una(req)
	const data = {
		name: username,
		comment,
	};

	const validation = validationResult(req);

	if (!validation.isEmpty()) {
		return res.render('event', {
			title: `${event.name} — Viðburðasíðan`,
			data,
			event,
			registered,
			errors: validation.errors,
			auth,
			admin,
			username
		});
	}

	return next();
}
async function unregisterRoute(req, res) {
	const { username } = una(req);
	const { slug } = req.params;
	const event = await listEvent(slug);
	await unregister({ name: username, event: event.id })
	return res.redirect(`/${slug}`)
}
async function registerRoute(req, res) {
	const { comment } = req.body;
	const auth = req.isAuthenticated();
	const { username, admin } = una(req);
	const { slug } = req.params;
	const event = await listEvent(slug);
	try {
		await register({
			name: username,
			comment,
			event: event.id,
		})
	} catch (err) {
		const registered = await listRegistered(event.id)
		return res.render('event', {
			title: `${event.name} — Viðburðasíðan`,
			event,
			registered,
			errors: [],
			data: {},
			admin,
			auth,
			username,
			err
		});
	}
	return res.redirect(`/${event.slug}`)
}
function login(req, res) {
	if (req.isAuthenticated()) {
		return res.redirect('/');
	}

	let message = '';

	// Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
	// og hreinsum skilaboð
	if (req.session.messages && req.session.messages.length > 0) {
		message = req.session.messages.join(', ');
		req.session.messages = [];
	}

	return res.render('login', { message, title: 'Innskráning' });
}
async function createValidationCheck(req, res, next) {
	const validation = validationResult(req);

	if (!validation.isEmpty()) {
		throw new Error(validation.errors.concat(customValidations))
	}
}
async function createAccount(req, res) {
	const { username, password, king } = req.body
	try {
		createValidationCheck(req, res)
		await createUser(username, password, king)
	} catch (err) {
		const message = err;
		return res.render('register', { message, title: 'Nýskráning' })
	}
	return res.redirect('/')
}

indexRouter.get('/register', (req, res) => res.render('register', { message: '', title: 'Nýskráning' }))
indexRouter.post('/register',
	userRegistrationValidationMiddleware(),
	userXssSanitizationMiddleware(),
	userSanitizationMiddleware(),
	(catchErrors(createAccount)))
indexRouter.get('/login', login);
indexRouter.post(
	'/login',
	// Þetta notar strat að ofan til að skrá notanda inn
	passport.authenticate('local', {
		failureMessage: 'Notandanafn eða lykilorð vitlaust.',
		failureRedirect: '/login',
	}),

	// Ef við komumst hingað var notandi skráður inn, senda á /admin
	(req, res) => {
		res.redirect('/');
	}
);

indexRouter.get('/logout', (req, res) => {
	// logout hendir session cookie og session
	req.logout();
	res.redirect('/');
});
indexRouter.post(
	'/:slug/leave',
	(req, res) => { catchErrors(unregisterRoute(req, res)) }
)
indexRouter.get('/', catchErrors(indexRoute));
indexRouter.get('/:slug', catchErrors(eventRoute));
indexRouter.post(
	'/:slug',
	registrationValidationMiddleware('comment'),
	xssSanitizationMiddleware('comment'),
	catchErrors(validationCheck),
	sanitizationMiddleware('comment'),
	catchErrors(registerRoute)
);