import React, { Component } from 'react';
import { searchUsers, setUser } from './profileActions';
import { connect } from 'react-redux';
import { Search, Grid, Segment } from 'semantic-ui-react';
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
			<div className='assessment-delegate'>
				<Search
					className='assessment-delegate__search'
					noResultsMessage='Нет данных'
					onResultSelect={this.setValue}
					onSearchChange={debounce(this.handleSearchChange, 500, { leading: true })}
					results={results}
					value={val}
				/>
				{value &&
					<Segment className='assessment-manager__info'>
						<div>ФИО: <strong>{value.title}</strong></div>
						<div>Должность: <strong>{value.position}</strong></div>
						<div>Подразделение: <strong>{value.department}</strong></div>
					</Segment>
				}
			</div>
		);
	}
}

function mapStateToProps(state){
    return state.app.profile.delegate;
}

export default connect(mapStateToProps, { searchUsers, setUser })(SelectUser);