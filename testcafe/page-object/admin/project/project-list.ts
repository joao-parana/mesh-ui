import { t, Selector } from 'testcafe';

import { formControlCheckbox, formControlInput } from '../../../testUtil';

export interface ProjectCreateFormData {
    name: string;
    // TODO schema
    // schema?: string;
    anonymousAccess?: boolean;
}

export namespace projectList {
    export async function createProject(formData: ProjectCreateFormData) {
        await t.click(Selector('button').withText('CREATE PROJECT')).typeText(formControlInput('name'), formData.name);

        // Default is checked, so we uncheck only when it is explicitly set to false
        if (formData.anonymousAccess === false) {
            await t.click(formControlCheckbox('anonymousAccess'));
        }

        await t.click(Selector('mesh-create-project-modal button').withText('CREATE PROJECT'));
    }
}
