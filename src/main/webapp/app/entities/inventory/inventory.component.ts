import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { JhiEventManager, JhiParseLinks, JhiAlertService } from 'ng-jhipster';
import { Shopping_ListService } from "../shopping-list/shopping-list.service";
import { Inventory } from './inventory.model';
import { InventoryService } from './inventory.service';
import { ITEMS_PER_PAGE, Principal, ResponseWrapper } from '../../shared';
import { Shopping_List } from "../shopping-list/shopping-list.model";
import { Observable } from "rxjs/Observable";

@Component({
    selector: 'jhi-inventory',
    templateUrl: './inventory.component.html'
})
export class InventoryComponent implements OnInit, OnDestroy {
    isSaving: boolean;

currentAccount: any;
    inventories: Inventory[];
    error: any;
    success: any;
    eventSubscriber: Subscription;
    currentSearch: string;
    routeData: any;
    shoppingList: Shopping_List;
    links: any;
    totalItems: any;
    queryCount: any;
    itemsPerPage: any;
    page: any;
    predicate: any;
    previousPage: any;
    reverse: any;

    constructor(
        private inventoryService: InventoryService,
        private parseLinks: JhiParseLinks,
        private shoppingListService: Shopping_ListService,
        private jhiAlertService: JhiAlertService,
        private principal: Principal,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private eventManager: JhiEventManager
    ) {
        this.itemsPerPage = ITEMS_PER_PAGE;
        this.routeData = this.activatedRoute.data.subscribe((data) => {
            this.page = data.pagingParams.page;
            this.previousPage = data.pagingParams.page;
            this.reverse = data.pagingParams.ascending;
            this.predicate = data.pagingParams.predicate;
        });
        this.currentSearch = this.activatedRoute.snapshot && this.activatedRoute.snapshot.params['search'] ?
            this.activatedRoute.snapshot.params['search'] : '';
    }

    loadAll() {
        if (this.currentSearch) {
            this.inventoryService.search({
                page: this.page - 1,
                query: this.currentSearch,
                size: this.itemsPerPage,
                sort: this.sort()}).subscribe(
                    (res: ResponseWrapper) => this.onSuccess(res.json, res.headers),
                    (res: ResponseWrapper) => this.onError(res.json)
                );
            return;
        }
        this.inventoryService.query({
            page: this.page - 1,
            size: this.itemsPerPage,
            sort: this.sort()}).subscribe(
            (res: ResponseWrapper) => this.onSuccess(res.json, res.headers),
            (res: ResponseWrapper) => this.onError(res.json)
        );
    }
    loadPage(page: number) {
        if (page !== this.previousPage) {
            this.previousPage = page;
            this.transition();
        }
    }
    transition() {
        this.router.navigate(['/inventory'], {queryParams:
            {
                page: this.page,
                size: this.itemsPerPage,
                search: this.currentSearch,
                sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
            }
        });
        this.loadAll();
    }

    clear() {
        this.page = 0;
        this.currentSearch = '';
        this.router.navigate(['/inventory', {
            page: this.page,
            sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
        }]);
        this.loadAll();
    }
    search(query) {
        if (!query) {
            return this.clear();
        }
        this.page = 0;
        this.currentSearch = query;
        this.router.navigate(['/inventory', {
            search: this.currentSearch,
            page: this.page,
            sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
        }]);
        this.loadAll();
    }
    ngOnInit() {
        this.loadAll();
        this.principal.identity().then((account) => {
            this.currentAccount = account;
        });
        this.registerChangeInInventories();
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    trackId(index: number, item: Inventory) {
        return item.id;
    }
    registerChangeInInventories() {
        this.eventSubscriber = this.eventManager.subscribe('inventoryListModification', (response) => this.loadAll());
    }

    sort() {
        const result = [this.predicate + ',' + (this.reverse ? 'asc' : 'desc')];
        if (this.predicate !== 'id') {
            result.push('id');
        }
        return result;
    }
    
    save(data) {
        this.isSaving = true;
        var date = new Date();
        this.shoppingList = new Shopping_List();
        this.shoppingList.items = data + "";
        this.shoppingList.notes = "REMINDER: Stock up on this item! Created on: " + date;
        if (this.shoppingList.id !== undefined) {
            this.subscribeToSaveResponse(
                this.shoppingListService.update(this.shoppingList));
        } else {
            this.subscribeToSaveResponse(
                this.shoppingListService.create(this.shoppingList));
        }
    }
    private subscribeToSaveResponse(result: Observable<Shopping_List>) {
        result.subscribe((res: Shopping_List) =>
            this.onSaveSuccess(res), (res: Response) => this.onSaveError());
    }
    
    private onSaveSuccess(result: Shopping_List) {
        this.eventManager.broadcast({ name: 'shopping_ListListModification', content: 'OK'});
        this.isSaving = false;
    }
    
    private onSaveError() {
        this.isSaving = false;
    }

    private onSuccess(data, headers) {
        this.links = this.parseLinks.parse(headers.get('link'));
        this.totalItems = headers.get('X-Total-Count');
        this.queryCount = this.totalItems;
        // this.page = pagingParams.page;
        this.inventories = data;
    }
    private onError(error) {
        this.jhiAlertService.error(error.message, null, null);
    }
}
