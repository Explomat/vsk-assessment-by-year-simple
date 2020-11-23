import React, { Component } from 'react';
import { Icon, Radio } from 'semantic-ui-react';

class Item extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isOpen: false
		}

		this.handleClick = this.handleClick.bind(this);
	}

	handleClick(e) {
		e.stopPropagation();

		const { id, checked, children, onChange } = this.props;
		const hasChildren = !!children;

		if (!hasChildren) {
			onChange(id, !checked);
		} else {
			this.setState({
				isOpen: !this.state.isOpen
			});
		}
	}

	render() {
		const { isOpen } = this.state;
		const { checked, name, children, onChange } = this.props;
		const hasChildren = !!children;

		return (
			<li onClick={this.handleClick} className={`assessment-meta__li ${!hasChildren ? 'assessment-meta__li--has-not-children': ''}`}>
				<div className='assessment-meta__li-container'>
					{hasChildren && <span className='assessment-meta__li-icon'>{isOpen ? <Icon name='minus' /> : <Icon name='plus' />}</span>}
					<span className='assessment-meta__li-container-name'>{name}</span>
					{!hasChildren &&
						<Radio
							checked={checked}
							onChange={this.handleClick}
							style={{ float: 'right' }}
						/>
					}
				</div>
				{hasChildren && isOpen && <ul className='assessment-meta__ul'>{children}</ul>}
			</li>
		);
	}
}

export default Item;