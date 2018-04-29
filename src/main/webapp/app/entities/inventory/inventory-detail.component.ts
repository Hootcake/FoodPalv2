import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { JhiEventManager } from 'ng-jhipster';

import { Inventory } from './inventory.model';
import { InventoryService } from './inventory.service';
import { Account, LoginModalService, Principal } from '../../shared';

@Component({
    selector: 'jhi-inventory-detail',
    templateUrl: './inventory-detail.component.html'
})
export class InventoryDetailComponent implements OnInit, OnDestroy {

    inventory: Inventory;
    private subscription: Subscription;
    private eventSubscriber: Subscription;
    currentAccount: any;
    account: Account;

    constructor(
        private eventManager: JhiEventManager,
        private inventoryService: InventoryService,
        private route: ActivatedRoute,
        private principal: Principal,
    ) {
    }

    ngOnInit() {
        this.subscription = this.route.params.subscribe((params) => {
            this.load(params['id']);
        });
        this.principal.identity().then((account) => {
            this.account = account;
        });
        this.registerChangeInInventories();
    }

    load(id) {
        this.inventoryService.find(id).subscribe((inventory) => {
            this.inventory = inventory;
        });
    }
    previousState() {
        window.history.back();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.eventManager.destroy(this.eventSubscriber);
    }

    registerChangeInInventories() {
        this.eventSubscriber = this.eventManager.subscribe(
            'inventoryListModification',
            (response) => this.load(this.inventory.id)
        );
    }
}
