import React, { Component } from 'react';
import { Card, List, Alert, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import unescapeSymbols from '../../utils/unescape';
import { getUserDps } from './dpActions';
import { connect } from 'react-redux';
//import './index.css';

class DpList extends Component {

	componentDidMount(){
		const { match, getUserDps } = this.props;
		getUserDps(match.params.id);
	}

	render() {
		const { list, match } = this.props;
		if (list.length === 0) {
			return <Alert message='Нет данных' type='info' />
		}
		
		return (
			<div className='dps'>
				<Card>
					<List
						className='dp-list'
						itemLayout='horizontal'
						dataSource={list}
						renderItem={item => (
							<List.Item>
								<List.Item.Meta
									avatar={<Avatar size='small' icon={<UserOutlined/>} />}
									title={
										<div>
								 			<div className='dp_list-item'>{item.state_name}</div>
								 			<Link style={{color: '#1890ff'}} to={`${match.url}/${item.development_plan_id}`} key={item.development_plan_id}>{unescapeSymbols(item.person_fullname)}</Link>
								 		</div>
							 		}
									description={item.person_position_name}
								/>
							</List.Item>
						)}
					/>

					{/*<div className='dp-list'>
						<List>
							{list.map(l => {
								return (
									<List.Item
										key={l.development_plan_id}
									>
										 <List.Item.Meta
										 	avatar={<UserOutlined className='dp_user-icon dp_user-icon-no-margin'/>}
										 	title={
										 		<div>
										 			<div className='dp_list-item'>{l.state_name}</div>
										 			<Link style={{color: '#1890ff'}} to={`${match.url}/${l.development_plan_id}`} key={l.development_plan_id}>{unescapeSymbols(l.person_fullname)}</Link>
										 		</div>
										 	}
										 	description={l.status}
										 />
									</List.Item>
								)
							})}
						</List>
					</div>*/}
				</Card>
			</div>
		);
	}
}

function mapStateToProps(state){
	return {
		list: state.idp.dp.list
	}
}

export default connect(mapStateToProps, { getUserDps })(DpList);