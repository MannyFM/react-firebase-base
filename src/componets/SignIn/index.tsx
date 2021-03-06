import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { compose } from 'recompose';

import { SignUpLink } from '../SignUp';
import { withFirebase, WithFirebase } from '../Firebase';
import { PasswordForgetLink } from '../PasswordForget';
import ROUTES from '../../constants/routes';

const SignInPage = () => (
	<div>
		<h1>SignIn</h1>
		<SignInForm/>
		<SignInGoogle/>
		<SignInGithub/>
		<PasswordForgetLink/>
		<SignUpLink/>
	</div>
);

const ERROR_CODE_ACCOUNT_EXISTS = 'auth/account-exists-with-different-credential';
const ERROR_MSG_ACCOUNT_EXISTS = `
  An account with an E-Mail address to
  this social account already exists. Try to login from
  this account instead and associate your social accounts on
  your personal account page.
`;

type WithFirebaseAndHistory = WithFirebase & RouteComponentProps;

type ErrorState = {
	error: Error | null;
};

type FormState = {
	email: string;
	password: string;
} & ErrorState;

const INITIAL_FORM_STATE: FormState = {
	email: '',
	password: '',
	error: null,
};

class SignInFormBase extends React.Component<WithFirebaseAndHistory, FormState> {
	readonly state: FormState = {...INITIAL_FORM_STATE};

	render() {
		const {email, password, error} = this.state;

		const isInvalid = password === '' || email === '';

		return (
			<form onSubmit={this.onSubmit}>
				<input
					name="email"
					value={email}
					onChange={this.onChange}
					type="text"
					placeholder="Email Address"
				/>
				<input
					name="password"
					value={password}
					onChange={this.onChange}
					type="password"
					placeholder="Password"
				/>
				<button disabled={isInvalid} type="submit">
					Sign In
				</button>

				{error && <p>{error.message}</p>}
			</form>
		);
	}

	private onSubmit: React.FormEventHandler = (event) => {
		const {email, password} = this.state;

		this.props.firebase
			.doSignInWithEmailAndPassword(email, password)
			.then(() => {
				this.setState({...INITIAL_FORM_STATE});
				this.props.history.push(ROUTES.HOME);
			})
			.catch(error => {
				this.setState({error});
			});
		event.preventDefault();
	};

	private onChange: React.ChangeEventHandler<HTMLInputElement> = ({target: {name, value}}) => {
		this.setState({[name]: value} as any);
	};
}

class SignInGoogleBase extends React.Component<WithFirebaseAndHistory, ErrorState> {
	readonly state: ErrorState = {error: null};
	onSubmit: React.FormEventHandler = (event) => {
		this.props.firebase
			.doSignInWithGoogle()
			.then((socialAuthUser) => {
				if (!socialAuthUser.user || !socialAuthUser.additionalUserInfo || !socialAuthUser.additionalUserInfo.profile)
					return;
				const email = (socialAuthUser.additionalUserInfo.profile as any)['email'];
				const username = socialAuthUser.user.displayName;
				return socialAuthUser.additionalUserInfo.isNewUser && this.props.firebase
					.user(socialAuthUser.user.uid)
					.set({
						username,
						email,
						roles: {},
					});
			})
			.then(() => {
				this.setState({error: null});
				this.props.history.push(ROUTES.HOME);
			})
			.catch((error) => {
				if (error.code == ERROR_CODE_ACCOUNT_EXISTS) {
					error.message = ERROR_MSG_ACCOUNT_EXISTS;
				}
				this.setState({error});
			});
		event.preventDefault();
	};

	render() {
		const {error} = this.state;
		return (
			<form onSubmit={this.onSubmit}>
				<button type='submit'>Sign in with Google</button>

				{error && <p>{error.message}</p>}
			</form>
		);
	}
}

class SignInGithubBase extends React.Component<WithFirebaseAndHistory, ErrorState> {
	readonly state: ErrorState = {error: null};
	onSubmit: React.FormEventHandler = (event) => {
		this.props.firebase
			.doSignInWithGithub()
			.then((socialAuthUser) => {
				if (!socialAuthUser.user || !socialAuthUser.additionalUserInfo || !socialAuthUser.additionalUserInfo.profile)
					return;
				const email = (socialAuthUser.additionalUserInfo.profile as any)['email'];
				const username = socialAuthUser.user.displayName;
				return socialAuthUser.additionalUserInfo.isNewUser && this.props.firebase
					.user(socialAuthUser.user.uid)
					.set({
						username,
						email,
						roles: {},
					});
			})
			.then(() => {
				this.setState({error: null});
				this.props.history.push(ROUTES.HOME);
			})
			.catch(error => {
				if (error.code == ERROR_CODE_ACCOUNT_EXISTS) {
					error.message = ERROR_MSG_ACCOUNT_EXISTS;
				}
				this.setState({error});
			});
		event.preventDefault();
	};

	render() {
		const {error} = this.state;
		return (
			<form onSubmit={this.onSubmit}>
				<button type='submit'>Sign in with Github</button>

				{error && <p>{error.message}</p>}
			</form>
		);
	}
}

const SignInForm = compose<WithFirebaseAndHistory, {}>(
	withRouter,
	withFirebase
)(SignInFormBase);

const SignInGoogle = compose<WithFirebaseAndHistory, {}>(
	withRouter,
	withFirebase
)(SignInGoogleBase);

const SignInGithub = compose<WithFirebaseAndHistory, {}>(
	withRouter,
	withFirebase
)(SignInGithubBase);

export default SignInPage;

export { SignInForm, SignInGoogle, SignInGithub };
