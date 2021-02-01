import React, { Component } from 'react';
import { withRouter } from 'react-router';
import Meta from './meta';
import Dp from './dp/dp';
import DpList from './dp';
import Manager from './manager';
import Loader from '../components/loader';
import ErrorAlert from '../components/error';
import { Tabs } from 'antd';
import { connect } from 'react-redux';
import { error, getUsers } from './appActions';
import { Route, Redirect } from 'react-router-dom';
import 'antd/dist/antd.css';
import './App.css';

class App extends Component {

	constructor(props) {
		super(props);

		this.onTabChange = this.onTabChange.bind(this);
		this.routes = {
			meta: 'idp/meta',
			dps: 'idp/dps',
			manager: 'idp/users_by_manager'
		}
	}

	componentDidMount() {
		const { getUsers, match } = this.props;
		getUsers(match.params.id);
	}

	onTabChange(activeKey) {
		const { history } = this.props;
		history.push(activeKey);
	}

	render() {
		const { ui, error, dp, manager, match } = this.props;
		const dlen = dp.list.length > 0;
		const mlen = manager.list.length > 0;

		if (ui.isLoading) {
			return <Loader message='Загрузка' description='Загружаются результаты'/>;
		}

		return (
			<div className='idp'>
				<ErrorAlert message={ui.error} visible={!!ui.error} onClose={() => error(false)}/>

				<Tabs onChange={this.onTabChange}>
					{dlen && <Tabs.TabPane tab='Мой план развития' key={`${match.url}/${this.routes.dps}`} />}
					{mlen && <Tabs.TabPane tab='Мои сотрудники' key={`${match.url}/${this.routes.manager}`} /> }
				</Tabs>

				<Route exact path={`${match.path}/${this.routes.meta}`} component={Meta}/>
				<Route exact path={`${match.path}/${this.routes.dps}`} component={DpList}/>
				<Route exact path={`${match.path}/${this.routes.manager}`} component={Manager}/>
				<Route exact path={`${match.path}/${this.routes.dps}/:dp_id`} component={Dp}/>

				<Route exact path={match.path} render={() => {
					if (dlen) {
						return <Redirect to={`${match.url}/${this.routes.dps}`} />
					} else if (mlen) {
						return <Redirect to={`${match.url}/${this.routes.manager}`} />
					} else {
						return <Redirect to={`${match.url}/${this.routes.meta}`} />
					}
				}}/>
			</div>
		);
	}
}

function mapStateToProps(state){
	return {
		ui: state.idp.ui,
		dp: state.idp.dp,
		manager: state.idp.manager
	}
}

export default withRouter(connect(mapStateToProps, { error, getUsers })(App));