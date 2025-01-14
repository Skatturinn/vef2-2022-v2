import express from 'express';
import { validationResult } from 'express-validator';
import { catchErrors } from '../lib/catch-errors.js';
import {
	createEvent,
	deleteEvent,
	listEvent,
	listEventByName,
	listEvents,
	updateEvent,
} from '../lib/db.js';
import passport, { ensureLoggedIn } from '../lib/login.js';
import { slugify } from '../lib/slugify.js';
import {
	isUrlValid,
	registrationValidationMiddleware,
	sanitizationMiddleware,
	xssSanitizationMiddleware,
} from '../lib/validation.js';

export const adminRouter = express.Router();

export async function index(req, res) {
	const events = await listEvents();
	const { user: { username, admin } = {} } = req || {};
	// console.log(req.user)
	return res.render('admin', {
		username,
		events,
		errors: [],
		data: {},
		title: 'Viðburðir — umsjón',
		admin,
	});
}
async function validationCheck(req, res, next) {
	const { name, description, location, url } = req.body;

	const events = await listEvents();
	const { user: { username } = {} } = req;

	const data = {
		name,
		description,
		location,
		url
	};

	const validation = validationResult(req);
	const customValidations = [];
	if (url && !isUrlValid(url)) {
		customValidations.push({
			param: 'url',
			msg: 'Hlekkur er ekki gild slóð'
		})
	}
	const eventNameExists = await listEventByName(name);

	if (eventNameExists !== null) {
		customValidations.push({
			param: 'name',
			msg: 'Viðburður með þessu nafni er til',
		});
	}

	if (!validation.isEmpty() || customValidations.length > 0) {
		return res.render('admin', {
			events,
			username,
			title: 'Viðburðir — umsjón',
			data,
			errors: validation.errors.concat(customValidations),
			admin: true,
		});
	}

	return next();
}
async function registerRoute(req, res) {
	const { name, description, location, url } = req.body;
	const slug = slugify(name);

	const created = await createEvent({ name, slug, description, location, url });

	if (created) {
		return res.redirect('/');
	}

	return res.render('error');
}
async function updateRoute(req, res) {
	const { name, description } = req.body;
	const { slug } = req.params;

	const event = await listEvent(slug);

	const newSlug = slugify(name);

	const updated = await updateEvent(event.id, {
		name,
		slug: newSlug,
		description,
	});

	if (updated) {
		return res.redirect('/admin');
	}

	return res.render('error');
}
async function validationCheckUpdate(req, res, next) {
	const { name, description } = req.body;
	const { slug } = req.params;
	const { user: { username } = {} } = req;

	const event = await listEvent(slug);

	const data = {
		name,
		description,
	};

	const validation = validationResult(req);

	const customValidations = [];

	const eventNameExists = await listEventByName(name);

	if (eventNameExists !== null && eventNameExists.id !== event.id) {
		customValidations.push({
			param: 'name',
			msg: 'Viðburður með þessu nafni er til',
		});
	}

	if (!validation.isEmpty() || customValidations.length > 0) {
		return res.render('admin-event', {
			username,
			event,
			title: 'Viðburðir — umsjón',
			data,
			errors: validation.errors.concat(customValidations),
			admin: true,
		});
	}

	return next();
}
async function eventRoute(req, res, next) {
	const { slug } = req.params;
	const { user: { username } = {} } = req;

	const event = await listEvent(slug);

	if (!event) {
		return next();
	}

	return res.render('admin-event', {
		username,
		title: `${event.name} — Viðburðir — umsjón`,
		event,
		errors: [],
		data: { name: event.name, description: event.description },
	});
}
async function deleteRoute(req, res) {
	const { slug } = req.params;
	console.log(slug)
	const event = await listEvent(slug);
	await deleteEvent(event.id);
	return res.redirect('/')
}

adminRouter.get('/', ensureLoggedIn, catchErrors(index));
adminRouter.post(
	'/',
	ensureLoggedIn,
	registrationValidationMiddleware('description'),
	xssSanitizationMiddleware('description'),
	sanitizationMiddleware('description'),
	catchErrors(validationCheck),
	catchErrors(registerRoute)
);

// Verður að vera seinast svo það taki ekki yfir önnur route
adminRouter.get('/:slug', ensureLoggedIn, catchErrors(eventRoute));
adminRouter.post(
	'/:slug',
	ensureLoggedIn,
	registrationValidationMiddleware('description'),
	xssSanitizationMiddleware('description'),
	catchErrors(validationCheckUpdate),
	sanitizationMiddleware('description'),
	catchErrors(updateRoute)
);
adminRouter.post('/:slug/delete',
	ensureLoggedIn,
	catchErrors(deleteRoute))

