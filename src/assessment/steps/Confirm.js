import React from 'react';
import { connect } from 'react-redux';
import { Message, Grid, Icon, Segment, Header } from 'semantic-ui-react';

const Confirm = ({ manager, status }) => {
	return (
		<div>
			<Message icon warning>
				<Icon size='large' name='attention' />
				<Message.Content>
					<Message.Header>Проверьте данные!</Message.Header>
					<p>
						Перед сохранением убедитесь в правильности внесения данных.
					</p>
				 </Message.Content>
			</Message>
			<Segment basic>
				<Grid>
					<Grid.Row>
						{status === 'user' ? <Header as='h3'>У вас нет подчинённых</Header> : <Header as='h3'>У вас есть подчинённые</Header>}
					</Grid.Row>
					<Grid.Row>
						<Header as='h4'>Ваш руководитель</Header>
					</Grid.Row>
					<Grid.Row>
						ФИО: {manager.value.title} 
					</Grid.Row>
					<Grid.Row>Должность: {manager.value.position}</Grid.Row>
					<Grid.Row>Подразделение: {manager.value.department}</Grid.Row>
				</Grid>
			</Segment>
		</div>
	);
};

function mapStateToProps(state){
    return state.app.steps;
}

export default connect(mapStateToProps)(Confirm);