import {m} from 'malevic';

import type {ViewProps} from '../../../definitions';
import {HOMEPAGE_URL} from '../../../utils/links';
import {AppVersion} from './version';

interface AboutTabProps {
    plus?: boolean;
}

export function AboutTab(_props: ViewProps & AboutTabProps): Malevic.Child {
    return <div class="settings-tab about-tab">
        <AppVersion />
        <div>
            <a href={HOMEPAGE_URL} target="_blank" rel="noopener noreferrer">
                Project Repository
            </a>
        </div>
        <div>
            <a href={`${HOMEPAGE_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
                MIT License
            </a>
        </div>
    </div>;
}
