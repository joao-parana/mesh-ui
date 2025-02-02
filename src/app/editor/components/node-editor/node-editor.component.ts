import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalService } from 'gentics-ui-core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { MeshPreviewUrl, MeshPreviewUrlResolver } from '../../../common/models/appconfig.model';
import { MeshNode, ProjectNode } from '../../../common/models/node.model';
import { Project } from '../../../common/models/project.model';
import { Schema } from '../../../common/models/schema.model';
import { GraphQLErrorFromServer, NodeResponse, TagReferenceFromServer } from '../../../common/models/server-models';
import { initializeNode } from '../../../common/util/initialize-node';
import * as NodeUtil from '../../../common/util/node-util';
import { getMeshNodeBinaryFields, notNullOrUndefined, simpleCloneDeep } from '../../../common/util/util';
import { ApiService } from '../../../core/providers/api/api.service';
import { ConfigService } from '../../../core/providers/config/config.service';
import { ListEffectsService } from '../../../core/providers/effects/list-effects.service';
import { I18nService } from '../../../core/providers/i18n/i18n.service';
import { NavigationService } from '../../../core/providers/navigation/navigation.service';
import { FormGeneratorComponent } from '../../../form-generator/components/form-generator/form-generator.component';
import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { EntitiesService } from '../../../state/providers/entities.service';
import { EditorEffectsService } from '../../providers/editor-effects.service';
import { OpenerService } from '../../providers/opener.service';
import { NodeConflictDialogComponent } from '../node-conflict-dialog/node-conflict-dialog.component';
import { NodeTagsBarComponent } from '../node-tags-bar/node-tags-bar.component';
import { ProgressbarModalComponent } from '../progressbar-modal/progressbar-modal.component';

@Component({
    selector: 'mesh-node-editor',
    templateUrl: './node-editor.component.html',
    styleUrls: ['./node-editor.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodeEditorComponent implements OnInit, OnDestroy {
    node: MeshNode | undefined;
    schema: Schema | undefined;
    nodePathRouterLink: any[];
    nodeTitle = '';
    // TODO: make a fullscreen non-closable dialog for binary files preventing user from navigating away while file is uploading
    // isSaving$: Observable<boolean>;
    isSaving = false;
    nodeUtil = NodeUtil;

    /** defined in assests/config/mesh-ui-config.js */
    previewUrls: MeshPreviewUrl[];

    projectName: string;

    private destroy$ = new Subject<void>();

    @ViewChild('formGenerator') formGenerator?: FormGeneratorComponent;
    @ViewChild('tagsBar') tagsBar?: NodeTagsBarComponent;

    constructor(
        private state: ApplicationStateService,
        private entities: EntitiesService,
        private changeDetector: ChangeDetectorRef,
        private editorEffects: EditorEffectsService,
        private listEffects: ListEffectsService,
        private navigationService: NavigationService,
        private route: ActivatedRoute,
        private i18n: I18nService,
        private modalService: ModalService,
        private api: ApiService,
        private config: ConfigService,
        private opener: OpenerService
    ) {}

    ngOnInit(): void {
        this.route.paramMap.subscribe(paramMap => {
            const projectName = paramMap.get('projectName');
            const nodeUuid = paramMap.get('nodeUuid');
            const schemaUuid = paramMap.get('schemaUuid');
            const parentNodeUuid = paramMap.get('parentNodeUuid');
            const language = paramMap.get('language');

            if (projectName && nodeUuid && language) {
                this.projectName = projectName;
                setTimeout(() => {
                    // Opening the node needs to be done on the next change detection tick,
                    // otherwise the parent component (MasterDetailComponent) will report
                    // a change detection error in dev mode.
                    this.editorEffects.openNode(projectName, nodeUuid, language);
                });
            } else if (projectName && schemaUuid && parentNodeUuid && language) {
                this.editorEffects.createNode(projectName, schemaUuid, parentNodeUuid, language);
            } else {
                throw new Error(`Cannot open or create a node. Required parameters are missing.`);
            }
        });

        // get node opened in editor
        this.state
            .select(state => state.editor.openNode)
            .filter(notNullOrUndefined)
            .switchMap(openNode => {
                const schemaUuid = openNode.schemaUuid;
                const parentNodeUuid = openNode.parentNodeUuid;
                if (schemaUuid && parentNodeUuid) {
                    return this.entities.selectSchema(schemaUuid).map(schema => {
                        const node = initializeNode(schema, parentNodeUuid, openNode.language);
                        return [node, schema] as [MeshNode, Schema];
                    });
                } else {
                    const node$ = this.entities.selectNode(openNode.uuid, { language: openNode.language });

                    const latest = Observable.combineLatest(
                        node$.filter<MeshNode>(Boolean).map(node => {
                            return simpleCloneDeep(node);
                        }),
                        node$.switchMap(node => {
                            return this.entities.selectSchema(node.schema.uuid!);
                        })
                    );
                    return latest;
                }
            })
            .takeUntil(this.destroy$)
            .subscribe(([node, schema]) => {
                if (this.formGenerator) {
                    this.formGenerator.setPristine(node);
                }
                this.node = node;
                if (this.node.project && this.node.project.name) {
                    this.previewUrls = this.config.getPreviewUrlsByProjectName(this.node.project.name) || null;
                }
                this.schema = schema;
                this.nodeTitle = this.getNodeTitle();
                this.nodePathRouterLink = this.getNodePathRouterLink();
                this.changeDetector.markForCheck();
            });
    }

    ngOnDestroy(): void {
        this.editorEffects.closeEditor();
        this.destroy$.next();
        this.destroy$.complete();
    }

    getNodePath(): string {
        if (!this.node || !this.node.breadcrumb) {
            return '';
        }

        // We are using slice(1) here because we don't want to show the root node
        if (this.node.breadcrumb) {
            return this.node.breadcrumb
                .slice(1)
                .map(b => b.displayName)
                .join(' › ');
        } else {
            return '';
        }
    }

    getNodePathRouterLink(): any[] {
        if (!this.node) {
            return [];
        }
        if (this.node.project && this.node.project.name) {
            return this.navigationService.list(this.node.project.name, this.node.parentNode.uuid).commands();
        } else {
            return [];
        }
    }

    /** Returns true if the node is a draft version */
    isDraft(): boolean {
        return (
            !!this.node &&
            !!this.node.language &&
            !!this.node.availableLanguages &&
            !(
                this.node.availableLanguages[this.node.language].published &&
                this.node.availableLanguages[this.node.language].version === this.node.version
            )
        );
    }

    /** Returns true if the node has been published and not been unpublished since */
    isPublic(): boolean {
        return (
            !!this.node &&
            !!this.node.language &&
            !!this.node.availableLanguages &&
            this.node.availableLanguages[this.node.language].published
        );
    }

    /**
     * Carries on the saving process and displays a loading overlay if any binary fields has to be uploaded.
     */
    private saveNodeWithProgress(saveFn: Promise<any> | null, node: MeshNode): Promise<any> {
        const numBinaryFields = Object.keys(getMeshNodeBinaryFields(node)).length;

        if (numBinaryFields > 0) {
            return this.modalService
                .fromComponent(
                    ProgressbarModalComponent,
                    {
                        closeOnOverlayClick: false,
                        closeOnEscape: false
                    },
                    {
                        translateToPlural: numBinaryFields > 1
                    }
                )
                .then(modal => {
                    modal.open();
                    if (saveFn) {
                        saveFn.then(() => modal.instance.closeFn(null));
                    }
                });
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Validate if saving is required.
     * Open a file upload progress if binary fields are present upload.
     * Tags might be explicitly passed in if we are solving the conflicts and we chose the tags from the remote version. Otherwise look if tags were edited or not (tagsBar.isDirty)
     *
     */
    saveNode(navigateOnSave = true, tags?: TagReferenceFromServer[]): void {
        // TODO: remove the test case when done with conflict resolution.
        // To quickly test the handleSaveConflicts, uncomment bellow:
        /*
            this.handleSaveConflicts(['name', 'pets', 'number', 'Html', 'Adate', 'othernode', 'Bool', 'microschema.name', 'microschema.number']);
            return;
        */
        const formGenerator = this.formGenerator;
        const tagsBar = this.tagsBar;
        if (!this.node || !formGenerator || !tagsBar) {
            throw new Error('Could not save node. One or more expected objects were not present.');
        }
        this.isSaving = true;
        let saveFn: Promise<any> | null = null;
        tags = !!tags ? tags : tagsBar.isDirty ? tagsBar.nodeTags : undefined;

        if (!this.node.uuid) {
            // Create new node.
            const parentNode = this.entities.getNode(this.node.parentNode.uuid, { language: this.node.language });
            const projectName = parentNode && parentNode.project.name;
            if (parentNode && projectName) {
                saveFn = this.editorEffects.saveNewNode(projectName, this.node, tags).then(
                    node => {
                        this.isSaving = false;
                        if (node && node.language) {
                            formGenerator.setPristine(node);
                            this.listEffects.loadChildren(projectName, parentNode.uuid, node.language);

                            if (navigateOnSave) {
                                this.navigationService.detail(projectName, node.uuid, node.language).navigate();
                            }
                        }
                    },
                    error => {
                        this.isSaving = false;
                        this.changeDetector.detectChanges();
                    }
                );
            }
        } else {
            saveFn = this.editorEffects.saveNode(this.node, tags).then(
                node => {
                    this.isSaving = false;
                    // reload preview tab
                    this.opener.reload();
                    if (node && node.project.name && node.language) {
                        formGenerator.setPristine(node);
                        this.listEffects.loadChildren(node.project.name, node.parentNode.uuid, node.language);
                        this.changeDetector.markForCheck();
                    }
                },
                error => {
                    this.handleSaveErrors(error);
                    this.isSaving = false;
                    this.changeDetector.detectChanges();
                }
            );
        }
        this.saveNodeWithProgress(saveFn, this.node);
    }

    handleSaveErrors(errorResponse: {
        field?: any;
        error: any;
        conflict: GraphQLErrorFromServer | null;
        node: NodeResponse | null;
    }): void {
        if (!this.node) {
            throw new Error('Cannot handle save conflicts because this.node is undefined.');
        }
        if (
            errorResponse.error &&
            errorResponse.error.originalError &&
            errorResponse.error.originalError.status === 413 &&
            errorResponse.field
        ) {
            console.log(errorResponse.field);
            this.modalService
                .dialog({
                    title: this.i18n.translate('modal.file_too_large'),
                    body: this.i18n.translate('modal.file_too_large_body', errorResponse.field),
                    buttons: [
                        {
                            label: this.i18n.translate('common.okay_button')
                        }
                    ]
                })
                .then(modal => modal.open());
            return;
        }

        // Assure data
        if (
            !errorResponse.conflict ||
            !errorResponse.conflict.type ||
            !errorResponse.conflict.i18nParameters ||
            errorResponse.conflict.i18nParameters.length === 0
        ) {
            // If response is malformed, show general error modal
            this.modalService
                .dialog({
                    title: this.i18n.translate('modal.server_error'),
                    body: this.i18n.translate('editor.node_save_error'),
                    buttons: [
                        {
                            label: this.i18n.translate('modal.close_button')
                        }
                    ]
                })
                .then(modal => modal.open());
            return;
        }

        // Handle save conflicts via modal
        this.api.project
            .getNode({ project: this.node.project.name!, nodeUuid: this.node.uuid })
            .take(1)
            .subscribe((response: NodeResponse) => {
                this.modalService
                    .fromComponent(
                        NodeConflictDialogComponent,
                        {
                            closeOnOverlayClick: false,
                            width: '90%',
                            onClose: (reason: any): void => {
                                this.changeDetector.detectChanges();
                            }
                        },
                        {
                            /**
                                Error response seems to have changed from
                                documentation at https://getmesh.io/docs/api/#project__nodes__nodeUuid__post .
                                Issued additional tests for verification.
                                Currently, only one conflicting field is contained in response at errorResponse.conflict.i18nParameters[0] .
                            **/
                            conflicts: [errorResponse.conflict!.i18nParameters![0]],
                            localTags: this.tagsBar ? this.tagsBar.nodeTags : [],
                            localNode: this.node,
                            remoteNode: response as MeshNode
                        }
                    )
                    .then(modal => modal.open())
                    .then(mergedNode => {
                        this.node = mergedNode;
                        this.saveNode(true, mergedNode.tags);
                        // reset form input values
                        this.formGenerator!.generateForm();
                    });
            });
    }

    async publishNode() {
        if (this.node) {
            await this.beforePublish();
            this.editorEffects.publishNodeLanguage(this.node);
        }
    }

    /**
     * Open node preview url defined in assests/config/mesh-ui-config.js
     * @param urlResolver returns url string from parameter
     */
    previewNode(urlResolver: MeshPreviewUrlResolver): void {
        if (!this.node) {
            throw new Error('No node for preview defined!');
        }
        const url = urlResolver(this.node);
        // open new tab
        this.opener.open(url);
    }

    // This function is used as an input for a component.
    // To bind this controller to the function, we declare it as a fat arrow function.
    beforePublish = () => {
        if (this.node && this.tagsBar) {
            const tags = this.tagsBar.isDirty ? this.tagsBar.nodeTags : undefined;
            return this.isDirty ? this.editorEffects.saveNode(this.node, tags) : Promise.resolve(this.node);
        } else {
            return Promise.reject(undefined);
        }
    };

    closeEditor(): void {
        this.navigationService.clearDetail().navigate();
    }

    focusList(): void {
        this.state.actions.editor.focusList();
    }

    get isDirty(): boolean {
        return (!!this.formGenerator && this.formGenerator.isDirty) || (!!this.tagsBar && this.tagsBar.isDirty);
    }

    private getNodeTitle(): string {
        if (!this.node) {
            return '';
        }
        if (this.node.displayField) {
            return this.node.fields[this.node.displayField];
        } else {
            return this.node.uuid;
        }
    }

    public projectNode(): ProjectNode | undefined {
        return (
            this.node && {
                node: this.node
            }
        );
    }
}
