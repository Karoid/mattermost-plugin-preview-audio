import { useContext } from 'react';

import {getFileDownloadUrl} from 'mattermost-redux/utils/file_utils';

import './root.scss';

import MattermostContext from './contexts/MattermostContext';
import AudioPreview from './components/AudioPreview';

function Root() {
    const mmProps = useContext(MattermostContext);
    const { fileInfo } = mmProps;

    const isExternalFile = !fileInfo.id;

    let fileUrl;
    if (isExternalFile) {
        fileUrl = fileInfo.link;
    } else {
        fileUrl = getFileDownloadUrl(fileInfo.id);
    }

    return (
        <div className='preview__container'>
            <AudioPreview
                fileInfo={fileInfo}
                fileUrl={fileUrl}
            />
        </div>
    );
}

export default Root;
