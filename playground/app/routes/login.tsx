import { conform, useForm, parse } from '@conform-to/react';
import { type ActionArgs, type LoaderArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useId } from 'react';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

interface Login {
	email: string;
	password: string;
}

function parseLoginForm(formData: FormData) {
	return parse<Login>(formData, {
		resolve({ email, password }) {
			const error: Partial<Record<keyof Login, string>> = {};

			if (!email) {
				error.email = 'Email is required';
			}

			if (!password) {
				error.password = 'Password is required';
			}

			if (error.email || error.password) {
				return { error };
			}

			return {
				value: {
					email,
					password,
				},
			};
		},
	});
}

export async function loader({ request }: LoaderArgs) {
	return parseConfig(request);
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseLoginForm(formData);

	if (
		submission.value &&
		(submission.value.email !== 'me@edmund.dev' ||
			submission.value.password !== '$eCreTP@ssWord')
	) {
		submission.error[''] = 'The provided email or password is not valid';
	}

	return json({
		...submission,
		payload: {
			email: submission.payload.email,
			// Never send the password back to the client
		},
	});
}

export default function LoginForm() {
	const formId = useId();
	const config = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, { email, password }] = useForm<Login>({
		...config,
		id: formId,
		lastSubmission,
		onValidate: config.validate
			? ({ formData }) => parseLoginForm(formData)
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Login Form" lastSubmission={lastSubmission}>
				<Alert errors={form.errors} />
				<Field label="Email" config={email}>
					<input
						{...conform.input(email, { type: 'email' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Password" config={password}>
					<input {...conform.input(password, { type: 'password' })} />
				</Field>
			</Playground>
		</Form>
	);
}
