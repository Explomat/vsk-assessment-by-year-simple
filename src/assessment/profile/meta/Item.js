import React, { Component } from 'react';
import { Icon, Checkbox } from 'semantic-ui-react';

class Item extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isOpen: false
		}

		this.handleChangeOpen = this.handleChangeOpen.bind(this);
	}

	handleChangeOpen() {
		this.setState({
			isOpen: !this.state.isOpen
		});
	}

	render() {
		const { isOpen } = this.state;
		const { id, name, checked, children, onChange } = this.props;
		const hasChildren = !!children;

		return (
			<li className={`assessment-meta__li ${!hasChildren ? 'assessment-meta__li--has-not-children': ''}`}>
				<div className='assessment-meta__li-container'>
					{hasChildren && <span className='assessment-meta__li-icon' onClick={this.handleChangeOpen}>{isOpen ? <Icon name='minus' /> : <Icon name='plus' />}</span>}
					<span className='assessment-meta__li-container-name'>{name}</span>
					{!hasChildren && <Checkbox checked={checked} onChange={() => onChange(id, !checked)} style={{ float: 'right' }}/>}
				</div>
				{hasChildren && isOpen && <ul className='assessment-meta__ul'>{children}</ul>}
			</li>
		);
	}
}

export default Item;