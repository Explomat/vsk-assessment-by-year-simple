import React, { Component } from 'react';
import { Modal, Segment } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { getInstruction } from './profileActions';

class Instruction extends Component {

	componentDidMount() {
		const { match, getInstruction } = this.props;
		getInstruction(match.params.id);
	}

	render() {
		const { instruction, onClose } = this.props;

		return (
			<Modal size='large' open closeIcon onClose={onClose} style={{
				position: 'relative'
			}}>
				<Modal.Header>Ознакомьтесь с этапами прохождения оценки</Modal.Header>
				<Modal.Content  scrolling>
					<Modal.Description>
						<Segment basic dangerouslySetInnerHTML={{ __html: instruction }} />
					</Modal.Description>
				</Modal.Content>
			</Modal>
		);
	}
}

function mapStateToProps(state){
	const { profile } = state.assessment;

	return {
		instruction: profile.instruction
	}
}

export default withRouter(connect(mapStateToProps, { getInstruction })(Instruction));