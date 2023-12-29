import express from 'express';
import { validationResult } from 'express-validator';
import passport from 'passport';
import { catchErrors } from '../lib/catch-errors.js';
import { listEvents, listEvent, listRegistered, register } from '../lib/db.js';
import {
	registrationValidationMiddleware,
	sanitizationMiddleware,
	xssSanitizationMiddleware,
} from '../lib/validation.js';

export const indexRouter = express.Router();

async function indexRoute(req, res) {
	const events = await listEvents();
	res.render('index', {
		title: 'Viðburðasíðan',
		events
	});

}

async function eventRoute(req, res, next) {
	const { slug } = req.params;
	const event = await listEvent(slug);
	// console.log(req.user)
	if (!event) {
		return next()
	}
	const user = req.user || false;
	const registered = await listRegistered(event.id);

	return res.render('event', {
		title: `${event.name} — Viðburðasíðan`,
		event,
		registered,
		errors: [],
		data: {},
		user
	});
}

async function eventRegisteredRoute(req, res) {
	const events = await listEvents();

	res.render('registered', {
		title: 'Viðburðasíðan',
		events,
	});
}

async function validationCheck(req, res, next) {
	const { name, comment } = req.body;
	console.log(name, comment)

	// TODO tvítekning frá því að ofan
	const { slug } = req.params;
	// console.log(slug)
	const event = await listEvent(slug);
	// console.log(event)
	if (comment) {
		const registered = await listRegistered(event.id);
	}
	// const registered = await listRegistered(event.id);

	const data = {
		name,
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
		});
	}

	return next();
}
async function registerRoute(req, res) {
	const { name, comment } = req.body;
	const { slug } = req.params;
	const event = await listEvent(slug);
	console.log(event)
	const registered = await register({
		name,
		comment,
		event: event.id,
	});

	if (registered) {
		return res.redirect(`/${event.slug}`);
	}

	return res.render('error');
}
function login(req, res) {
	if (req.isAuthenticated()) {
		return res.redirect('/admin');
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
indexRouter.post('/wutdahell',
	(req, res) => { console.log('yes'), res.redirect('/') })
indexRouter.get('/login', login);
indexRouter.post(
	'/login',
	// Þetta notar strat að ofan til að skrá notanda inn
	passport.authenticate('local', {
		failureMessage: 'Notandanafn eða lykilorð vitlaust.',
		failureRedirect: '/admin/login',
	}),

	// Ef við komumst hingað var notandi skráður inn, senda á /admin
	(req, res) => {
		res.redirect('/admin');
	}
);

indexRouter.get('/logout', (req, res) => {
	// logout hendir session cookie og session
	req.logout();
	res.redirect('/');
});

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

// TODO útfæra öll routes
indexRouter.get('/:slug/thanks', catchErrors(eventRegisteredRoute));
