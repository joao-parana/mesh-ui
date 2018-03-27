import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, ParamMap, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { ModalService, IDialogConfig } from 'gentics-ui-core';
import { MeshNode } from '../../../common/models/node.model';
import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { NavigationService } from '../../../core/providers/navigation/navigation.service';
import { I18nService } from '../../../core/providers/i18n/i18n.service';
import { ListEffectsService } from '../../../core/providers/effects/list-effects.service';
import { EntitiesService } from '../../../state/providers/entities.service';
import { ApiService } from '../../../core/providers/api/api.service';

@Component({
    selector: 'app-node-row',
    templateUrl: './node-row.component.html',
    styleUrls: ['./node-row.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodeRowComponent implements OnInit, OnDestroy {
    @Input() node: MeshNode;
    @Input() listLanguage: string;

    private subscription: Subscription =  new Subscription();

    filterTerm$: Observable<string>;

    routerLink: any[] = null;

    constructor(private state: ApplicationStateService,
                private navigationService: NavigationService,
                private modalService: ModalService,
                private i18n: I18nService,
                private listEffects: ListEffectsService,
                private entities: EntitiesService,
                private api: ApiService,
                private activatedRoute: ActivatedRoute,
                private router: Router ) {
    }

    ngOnInit() {
        if (this.node.container) {
            this.routerLink = this.navigationService.list(this.node.project.name, this.node.uuid, this.listLanguage).commands();
        } else {
            this.routerLink = this.navigationService.detail(this.node.project.name, this.node.uuid, this.node.language).commands();
        }

        this.filterTerm$ = this.state.select(state => state.list.filterTerm);
    }

    editNode(): void {
        this.navigationService.detail(this.node.project.name, this.node.uuid, this.node.language).navigate();
    }

    copyNode(): void {
        // TODO
    }

    moveNode(): void {
        // TODO
    }

    deleteNode(): void {
        const dialogConfig: IDialogConfig = {
            title: this.i18n.translate('modal.delete_node_title'),
            body: this.i18n.translate('modal.delete_node_body', { name: this.node.displayName }),
            buttons: [
                { label: this.i18n.translate('common.cancel_button'), type: 'secondary', shouldReject: true },
                { label: this.i18n.translate('common.delete_button'), type: 'alert', returnValue: true }
            ]
        };

        this.modalService.dialog(dialogConfig)
            .then(modal => modal.open())
            .then(() => {
                this.listEffects.deleteNode(this.node, true);
            });
    }

    /**
     * Focuses the editor if the clicked node is opened already.
     * Otherwise does nothing...
     */
    focusEditor() {
        if (this.node.container) { // Don't focus container on folder click.
            return;
        }

        // Since the activated route of container-contents component does not know of other parts of url - we have traverse it manually from the root node.
        const activeDetailRoute = this.activatedRoute.pathFromRoot.filter(router => {
            return router.firstChild &&  router.firstChild.outlet === 'detail';
        });

        if (activeDetailRoute.length) { // There is a node open already.
            const childRoute = activeDetailRoute[0].firstChild;
            const { projectName, nodeUuid, language } = childRoute.snapshot.params;

            // If open node params match with my params,
            if (projectName === this.node.project.name &&
                nodeUuid === this.node.uuid &&
                language === this.node.language) {
                }
                this.state.actions.editor.focusEditor();
        }
    }


    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
