import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { JhiEventManager, JhiAlertService } from 'ng-jhipster';

import { Category } from './category.model';
import { CategoryService } from './category.service';
import { Principal, ResponseWrapper } from '../../shared';

@Component({
    selector: 'jhi-category',
    templateUrl: './category.component.html'
})
export class CategoryComponent implements OnInit, OnDestroy {
categories: Category[];
    currentAccount: any;
    eventSubscriber: Subscription;
    currentSearch: string;

    constructor(
        private categoryService: CategoryService,
        private jhiAlertService: JhiAlertService,
        private eventManager: JhiEventManager,
        private activatedRoute: ActivatedRoute,
        private principal: Principal
    ) {
        this.currentSearch = this.activatedRoute.snapshot && this.activatedRoute.snapshot.params['search'] ?
            this.activatedRoute.snapshot.params['search'] : '';
    }

    loadAll() {
        if (this.currentSearch) {
            this.categoryService.search({
                query: this.currentSearch,
                }).subscribe(
                    (res: ResponseWrapper) => this.categories = res.json,
                    (res: ResponseWrapper) => this.onError(res.json)
                );
            return;
       }
        this.categoryService.query().subscribe(
            (res: ResponseWrapper) => {
                this.categories = res.json;
                this.currentSearch = '';
            },
            (res: ResponseWrapper) => this.onError(res.json)
        );
    }

    search(query) {
        if (!query) {
            return this.clear();
        }
        this.currentSearch = query;
        this.loadAll();
    }

    clear() {
        this.currentSearch = '';
        this.loadAll();
    }
    ngOnInit() {
        this.loadAll();
        this.principal.identity().then((account) => {
            this.currentAccount = account;
        });
        this.registerChangeInCategories();
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    trackId(index: number, item: Category) {
        return item.id;
    }
    registerChangeInCategories() {
        this.eventSubscriber = this.eventManager.subscribe('categoryListModification', (response) => this.loadAll());
    }

    private onError(error) {
        this.jhiAlertService.error(error.message, null, null);
    }
}
