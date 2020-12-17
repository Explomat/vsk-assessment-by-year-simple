import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Card, PageHeader, Select, Alert, List, Icon } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import unescapeSymbols from '../../utils/unescape';
import { connect } from 'react-redux';
import { getUserDpsByManager } from './managerActions';
import './index.css';

class Manager extends Component {

	constructor(props){
		super(props);

		this.handleChangeTutorRole = this.handleChangeTutorRole.bind(this);
	}

	componentDidMount(){
		const { match, currentTutorRole } = this.props;
		this.props.getUserDpsByManager(match.params, currentTutorRole);
	}

	handleChangeTutorRole(value){
		const { match } = this.props;
		this.props.getUserDpsByManager(match.params, value);
	}

	renderTutorRoles(){
		const { tutorRoles, currentTutorRole } = this.props;

		if (tutorRoles) {
			return (
				<Select defaultValue={currentTutorRole} onChange={this.handleChangeTutorRole}>
					{tutorRoles.map(t => {
						return (
							<Select.Option key={t.code} value={t.code}>{t.name}</Select.Option>
						);
					})}
				</Select>
			);
		}
	}

	render() {
		const { list, curator_fullname, history } = this.props;
		if (list.length === 0) {
			return <Alert message='Нет данных' type='info' />
		}
		return (
			<div className='curators'>
				<Card>
					{this.renderTutorRoles()}
					<List>
						{list.map(l => {
							return (
								<List.Item key={l.id}>
									 <List.Item.Meta
									 	avatar={<UserOutlined className='adaptation_user-icon adaptation_user-icon-no-margin'/>}
									 	title={
									 		<div>
									 			<div className='adaptation_list-item'>{l.type}</div>
									 			<Link style={{color: '#1890ff'}} to={`/adaptations/${l.id}`} key={l.id}>{unescapeSymbols(l.name)}</Link>
									 		</div>
									 	}
									 	description={l.status}
									 />
								</List.Item>
							)
						})}
					</List>
				</Card>
				{/*history.location.pathname === '/curators' ? (
					<Card>
						{this.renderTutorRoles()}
						<AdaptationList list={adaptationList}/>
					</Card>
				):(
					<PageHeader
						onBack={history.goBack}
						title={curator_fullname}
					>
						<div className='curators__tutor-header'>Сотрудники на адаптации</div>
						<AdaptationList list={adaptationList}/>
					</PageHeader>
				)*/}
			</div>
		);
	}
}

function mapStateToProps(state){
	return {
		...state.idp.manager
	}
}

export default withRouter(connect(mapStateToProps, { getUserDpsByManager })(Manager));