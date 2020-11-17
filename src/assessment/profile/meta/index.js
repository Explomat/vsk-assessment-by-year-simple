import React, { Component } from 'react';
import Item from './Item';
import { withRouter, Redirect } from 'react-router';
import { List, Card, Button, Modal, Header, Icon } from 'semantic-ui-react';
import { getMeta, onChecked } from './metaActions';
import { connect } from 'react-redux';

import './metaStyle.css';

class Meta extends Component {

	constructor(props) {
		super(props);

		this.renderChannels = this.renderChannels.bind(this);
		this.handleShowConfirm = this.handleShowConfirm.bind(this);
		this.handleCreateAssessment = this.handleCreateAssessment.bind(this);

		this.state = {
			isShowConfirm: false
		}
	}

	componentDidMount() {
		const { match, loadData } = this.props;
		loadData(match.params.id);
	}

	handleCreateAssessment() {
		const { match, loadData } = this.props;
		loadData(match.params.id);

		this.handleShowConfirm();
	}

	handleShowConfirm() {
		this.setState({
			isShowConfirm: !this.state.isShowConfirm
		});
	}

	renderChannels(channels) {
		const { onChecked } = this.props;

		return channels.map(c => {
			return (
				<Item onChange={onChecked} key={c.id} {...c}>
					{c.children.length > 0 ? this.renderChannels(c.children) : null}
				</Item>
			);
		});
	}

	render() {
		const { isShowConfirm } = this.state;
		const { ui, meta, match } = this.props;

		if (ui.isLoading) {
			return null;
		}

		if (!meta.hasPa && meta.shouldHasPa) {
			return (
				<div>
					<Card fluid className='assessment-meta'>
						<Card.Content header='Выберите критерии для набора компетенций' />
						<Card.Content>
							<ul className='assessment-meta__root-ul'>
								{this.renderChannels(meta.channels)}
							</ul>
						</Card.Content>
						<Card.Content extra>
							 <Button style={{float: 'right'}} onClick={this.handleShowConfirm} primary disabled={!meta.hasChecked}>Далее</Button>
						</Card.Content>
					</Card>
					{isShowConfirm &&
						<Modal open basic size='small'>
							<Header content='Подтвердите действие' />
							<Modal.Content>
								<p>{`Вы действительно хотите выбрать "${meta.selectedNode && meta.selectedNode.name}"`}</p>
							</Modal.Content>
							<Modal.Actions>
								<Button onClick={this.handleCreateAssessment} primary inverted>
									<Icon name='checkmark' /> Ok
								</Button>
							</Modal.Actions>
						</Modal>
					}
				</div>
			);
		} else {
			return <Redirect to={`/profile/${match.params.id}`} />
		}
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
		loadData: id => dispatch(getMeta(id)),
		onChecked: (id, isChecked) => dispatch(onChecked(id, isChecked))
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchProps)(Meta));