import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModalService } from 'gentics-ui-core';

import { TagsEffectsService } from '../core/providers/effects/tags-effects.service';
import { FormGeneratorModule } from '../form-generator/form-generator.module';
import { SharedModule } from '../shared/shared.module';

import { routes } from './admin.routes';
import { AdminBreadcrumbsComponent } from './components/admin-breadcrumbs/admin-breadcrumbs.component';
import { AdminListItemComponent } from './components/admin-list-item/admin-list-item.component';
import { AdminListComponent } from './components/admin-list/admin-list.component';
import { AdminShellComponent } from './components/admin-shell/admin-shell.component';
import { CreateProjectModalComponent } from './components/create-project-modal/create-project-modal.component';
import { GroupDetailComponent } from './components/group-detail/group-detail.component';
import { GroupListComponent } from './components/group-list/group-list.component';
import { MicroschemaDetailComponent } from './components/microschema-detail/microschema-detail.component';
import { MicroschemaEditorComponent } from './components/microschema-editor/microschema-editor.component';
import { MicroschemaListComponent } from './components/microschema-list/microschema-list.component';
import { MonacoEditorComponent } from './components/monaco-editor/monaco-editor.component';
import { NameInputDialogComponent } from './components/name-input-dialog/name-input-dialog.component';
import { ProjectDetailMicroschemasComponent } from './components/project-detail-microschemas/project-detail-microschemas.component';
import { ProjectDetailSchemasComponent } from './components/project-detail-schemas/project-detail-schemas.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';
import { ProjectListItemComponent } from './components/project-list-item/project-list-item.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { RoleDetailComponent } from './components/role-detail/role-detail.component';
import { RoleListComponent } from './components/role-list/role-list.component';
import { SchemaAssignmentComponent } from './components/schema-assignment/schema-assignment.component';
import { SchemaDetailComponent } from './components/schema-detail/schema-detail.component';
import { SchemaEditorComponent } from './components/schema-editor/schema-editor.component';
import { SchemaListComponent } from './components/schema-list/schema-list.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { UserGroupSelectComponent } from './components/user-group-select/user-group-select.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { AdminGroupEffectsService } from './providers/effects/admin-group-effects.service';
import { AdminPermissionEffectsService } from './providers/effects/admin-permission-effects.service';
import { AdminProjectEffectsService } from './providers/effects/admin-project-effects.service';
import { AdminRoleEffectsService } from './providers/effects/admin-role-effects.service';
import { AdminSchemaEffectsService } from './providers/effects/admin-schema-effects.service';
import { AdminUserEffectsService } from './providers/effects/admin-user-effects.service';
import { MicrochemaDetailsGuard } from './providers/guards/microschema-editor-guard';
import { SchemaDetailsGuard } from './providers/guards/schema-editor-guard';
import { GroupResolver } from './providers/resolvers/group-resolver';
import { MicroschemaResolver } from './providers/resolvers/microschema-resolver';
import { ProjectResolver } from './providers/resolvers/project-resolver';
import { RoleResolver } from './providers/resolvers/role-resolver';
import { SchemaResolver } from './providers/resolvers/schema-resolver';
import { UserResolver } from './providers/resolvers/user-resolver';

@NgModule({
    declarations: [
        AdminBreadcrumbsComponent,
        AdminShellComponent,
        ProjectListComponent,
        ProjectListItemComponent,
        CreateProjectModalComponent,
        MicroschemaListComponent,
        MicroschemaDetailComponent,
        SchemaListComponent,
        SchemaDetailComponent,
        SchemaEditorComponent,
        MicroschemaEditorComponent,
        MonacoEditorComponent,
        SchemaAssignmentComponent,
        UserListComponent,
        AdminListComponent,
        AdminListItemComponent,
        UserDetailComponent,
        UserGroupSelectComponent,
        ProjectDetailComponent,
        ProjectDetailSchemasComponent,
        ProjectDetailMicroschemasComponent,
        NameInputDialogComponent,
        GroupListComponent,
        GroupDetailComponent,
        RoleListComponent,
        RoleDetailComponent
    ],
    entryComponents: [CreateProjectModalComponent, NameInputDialogComponent],
    imports: [SharedModule, RouterModule.forChild(routes), ReactiveFormsModule, FormGeneratorModule],
    providers: [
        ModalService,
        AdminSchemaEffectsService,
        AdminProjectEffectsService,
        AdminUserEffectsService,
        AdminGroupEffectsService,
        AdminRoleEffectsService,
        AdminPermissionEffectsService,
        TagsEffectsService,
        UserResolver,
        GroupResolver,
        RoleResolver,
        SchemaResolver,
        MicroschemaResolver,
        ProjectResolver,
        SchemaDetailsGuard,
        MicrochemaDetailsGuard
    ]
})
export class AdminModule {
    public static routes = routes;
}
