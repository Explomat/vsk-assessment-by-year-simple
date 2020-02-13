import React from 'react';
//import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Grid, Divider, Message, Button, Icon } from 'semantic-ui-react';
import { setStatus } from './stepsActions';


const Status = ({ status, setManager, setUser }) => {
	return (
		<div className='assessment-steps__status'>
			<Grid columns={2} stackable textAlign='center'>
				<Grid.Row>
					<Grid.Column>
						<Message
								className='assessment-steps__status__message'
								success
								size='tiny'
								content='Есть ли у вас административные и/или функциональные подчиненные?'
							/>
					</Grid.Column>
				</Grid.Row>
				<Grid.Row verticalAlign='middle'>
					<Divider vertical>или</Divider>
					<Grid.Column>
						<Button
							icon labelPosition='right'
							basic
							secondary
							onClick={setManager}
						>
							{status === 'manager' && <Icon color='red' name='check' />}
							Да, у меня есть подчинённые
						</Button>
					</Grid.Column>

					<Grid.Column>
						<Button
							icon
							labelPosition='right'
							basic
							secondary
							onClick={setUser}
						>
							{status === 'user' && <Icon color='red' name='check' />}
							У меня нет подчинённых
						</Button>
					</Grid.Column>
				</Grid.Row>
			</Grid>
		</div>
	);
}

const mapStateToProps = state => {
	return state.app.steps;
}

const mergeProps = (stateProps, dispatchProps) => {
	const { dispatch } = dispatchProps;

	return {
		...stateProps,
		setManager: () => dispatch(setStatus('manager')),
		setUser: () => dispatch(setStatus('user'))
	}
};

export default connect(mapStateToProps, null, mergeProps)(Status);