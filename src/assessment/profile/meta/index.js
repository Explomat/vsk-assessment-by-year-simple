import React, { Component } from 'react';
import Item from './Item';
import TreeMenu from 'react-simple-tree-menu';
import { withRouter, Redirect } from 'react-router';
import { List } from 'semantic-ui-react';
import { getMeta } from './metaActions';
import { connect } from 'react-redux';

import '../../../../node_modules/react-simple-tree-menu/dist/main.css';

class Meta extends Component {

	constructor(props) {
		super(props);

		this.renderChannels = this.renderChannels.bind(this);
	}

	componentDidMount() {
		const { match, loadData } = this.props;
		loadData(match.params.id);
	}

	renderChannels(channels) {
		const queue = [];

		for (var i = 0; i < channels.length; i++) {
			queue.push(channels[i]);
		}

		const result = [];
		while(queue.length > 0) {
			var node = queue.shift();

			var children = [];
			for (var j = 0; j < node.children.length; j++) {
				queue.push(node.children[j]);
				children.push(<Item key={node.children[j].id} {...node.children[j]} />);
			}

			if (node.children.length > 0) {
				result.push(<Item key={node.id} {...node}>{children}</Item>);
			}
		}

		return result;
	}

	render() {
		const { ui, meta, match } = this.props;

		if (ui.isLoading) {
			return null;
		}

		if (meta.hasPa) {
			return <Redirect to={`/profile/${match.params.id}`} />
		}

		return (
			<div className='assessment-meta'>
				<TreeMenu
					data={meta.channels}
					hasSearch={false}
				>
					
				</TreeMenu>
				{/*this.renderChannels(meta.channels)*/}
			</div>
		);
	}
}


function mapStateToProps(state) {
	return {
		meta: state.app.meta,
		ui: state.app.ui
	}
}

function mapDispatchProps(dispatch, ownProps) {
	return {
		loadData: id => dispatch(getMeta(id))
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchProps)(Meta));