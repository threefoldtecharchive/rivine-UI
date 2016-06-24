import FilesListView from '../components/fileslist.js'
import { connect } from 'react-redux'
import { addFolderAskPathSize, removeFolder, resizeFolder, updateFolderToRemove } from '../actions/actions.js'
import { bindActionCreators } from 'redux'

const mapDispatchToProps = (dispatch) => ({
	actions: bindActionCreators({ addFolderAskPathSize, removeFolder, resizeFolder, updateFolderToRemove }, dispatch),
})

const mapStateToProps = (state) => ({
	acceptingContracts: state.hostingReducer.get('acceptingContracts'),
	folders: state.hostingReducer.get('files'),
    folderToRemove: state.hostingReducer.get('folderToRemove'),
})

const FilesList = connect(mapStateToProps, mapDispatchToProps)(FilesListView)
export default FilesList
