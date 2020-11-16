import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { HashRouter as Router, Route, Redirect } from 'react-router-dom';
import Profile from './profile';
import Meta from './profile/meta';
import { Dimmer, Loader, Message, Modal } from 'semantic-ui-react';

class App extends Component {

	render(){
		const { ui } = this.props;

		if (ui.error){
			return (
				<Modal size='tiny' centered={false} open>
					<Modal.Content>
						<Message negative>
							<Message.Header>Произошла ошибка! Обновите страницу.</Message.Header>
							<p>
								{ui.error}
							</p>
						</Message>
					</Modal.Content>
				</Modal>
			);
		}

		return (
			<div className='app'>
				{ui.isLoading && <Dimmer active inverted>
					<Loader inverted>Loading</Loader>
				</Dimmer>}
				<Route exact path='/meta/:id' render={() => <Meta />} />
				<Route exact path='/profile/:id' render={() => <Profile />} />
			</div>
		);
	}
}

function mapStateToProps(state){
	return {
		ui: state.app.ui
	}
}

export default withRouter(connect(mapStateToProps)(App));
