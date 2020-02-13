import React, { Component } from 'react';
import { searchUsers, setUser } from './stepsActions';
import { connect } from 'react-redux';
import { Message, Search, Header, Grid } from 'semantic-ui-react';
import { debounce } from 'lodash';

class SelectUser extends Component {

	constructor(props){
		super(props);

		this.setValue = this.setValue.bind(this);
		this.handleSearchChange = this.handleSearchChange.bind(this);
		this.state = {
			val: props.value ? props.value.title : ''
		}
	}

	setValue(e, { result }) {
		this.setState({
			val: result.title
		});

		this.props.setUser(result);
	}

	handleSearchChange(e, { value }) {
		if (value === ''){
			this.props.setUser(null);
		}
		this.setState({
			val: value
		});
		this.props.searchUsers(value);
	}

	render() {
		const { results, value } = this.props;
		const { val } = this.state;
		return (
			<div className='assessment-manager'>
				<Message warning>
					<Message.Header>Будьте внимательны при выборе руководителя!</Message.Header>
					<p>Именно он будет вас оценивать в дальнейшем.</p>
				</Message>
				<Search
					className='assessment-manager__search'
					noResultsMessage='Нет данных'
					onResultSelect={this.setValue}
					onSearchChange={debounce(this.handleSearchChange, 500, { leading: true })}
					results={results}
					value={val}
				/>
				{value &&
					<div className='assessment-manager__info'>
						<Grid className='assessment-manager__info-grid'>
							<Grid.Row>
								<Header as='h3'>Информация о руководителе</Header>
							</Grid.Row>
							<Grid.Row>
								ФИО: {value.title} 
							</Grid.Row>
							<Grid.Row>Должность: {value.position}</Grid.Row>
							<Grid.Row>Подразделение: {value.department}</Grid.Row>
						</Grid>
					</div>
				}
			</div>
		);
	}
}

function mapStateToProps(state){
    return state.app.selectedUser;
}

export default connect(mapStateToProps, { searchUsers, setUser })(SelectUser);