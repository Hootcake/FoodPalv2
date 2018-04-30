import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { JhiEventManager, JhiAlertService } from 'ng-jhipster';
import { Observable } from 'rxjs/Observable';
import { NgbModalRef, NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Recommend } from './recommend.model';
import { RecommendService } from './recommend.service';
import { Principal, ResponseWrapper, RecipeListService } from '../../shared';
import { InventoryService } from "../inventory/inventory.service";
import { Inventory } from "../inventory/inventory.model";
import { Shopping_ListService } from "../shopping-list/shopping-list.service";
import { FavoritesService } from "../favorites/favorites.service";
import { Favorites } from "../favorites/favorites.model";
import { Shopping_List } from "../shopping-list/shopping-list.model";
import {NgbCarouselConfig} from '@ng-bootstrap/ng-bootstrap';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';

export interface IAlert {
    id: number;
    type: string;
    message: string;
  }

//Modal dialog for recipe details
@Component({
  selector:'ngbd-modal-content',
  template:`<div class="modal-header">
      <h4 class="modal-title">Recipe Info   </h4> 
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
<ngb-tabset>
  <ngb-tab title="Main Information">
    <ng-template ngbTabContent>
        <p></p>
        <div align="center">
          <h2>{{ recipe.name }}</h2><div></div><img src="{{image}}" class="rounded img-responsive">
          <div *ngIf="recipe.yield">
              <b>Yields:</b> {{ recipe.yield }}
          </div>
          <div *ngIf="recipe.totalTime">
              <b>Total Time:</b> {{ recipe.totalTime }}
          </div>
          <div *ngIf="cuisine">
              <b>Cuisine:</b>
              <ng-container *ngFor="let c of cuisine">
                   {{ c }},
               </ng-container>
          </div>
          </div>
    </ng-template>
  </ngb-tab>
  
  
    <ngb-tab title="Detailed Ingredient Information">
        <ng-template ngbTabContent>
            <h2><div align = "center">Ingredients: </div></h2>
            <div *ngFor="let ingredient of recipe.ingredientLines; let i = index">
                 {{ i+1 }} : {{ ingredient }}
            </div>
      </ng-template>
    </ngb-tab>
        
        <ngb-tab title="Recipe Method and Source">
        <ng-template ngbTabContent>
                            <p></p>
                <h2 align = "center">Source</h2>
                <p></p>
                This great recipe comes courtesy of {{ recipe.source.sourceDisplayName }}
                <div></div>
                You can find more great recipes from them at <a> {{recipe.source.sourceSiteUrl }} </a>
                <p></p>
                <h2 align = "center">Method</h2>
                To get the method to make this recipe, click below: <div></div>
                <a href='{{recipe.source.sourceRecipeUrl}}' target="_blank" class="btn btn-info" role="button">Click here to go to the source!</a>
      </ng-template>
    </ngb-tab>
    
        

  </ngb-tabset> 
  
    </div>
    <div class="modal-footer">
      <td><button class="btn btn-md btn-outline-primary" (click)="save(recipe)">Save to Favourites</button></td>
      <button type="button" class="btn btn-outline-dark" (click)="activeModal.close('Close click')">Close</button>
    </div>`
})
export class NgbdModalContent {
  @Input() recipe: any;
  @Input() image: string;
  @Input() cuisine: any;
  @Input() ingredients: any;
  isSaving: boolean;
  recipeIngredients = new Array();
  testVar: Boolean = true;
  favorite: Favorites;
  currentAccount: any;
  largeImageDetails: any[];
  eventSubscriber: Subscription;
  currentSearch: string;
  choices = new Array();
  recipes: any[];
  recipeFound: boolean = false;
  recipeDetailsFound: boolean = false;
  
  constructor(public activeModal: NgbActiveModal,
          private eventManager: JhiEventManager,
          private favoriteService: FavoritesService) {}
  

  
  save(data) {
      this.isSaving = true;
      this.favorite = new Favorites();
      this.favorite.ingredients = "";
      this.favorite.recipe_title = data.name;
      this.favorite.cuisine = "";
      for(let ingredient of this.ingredients){
          this.favorite.ingredients += ingredient.toString() + ', ';
      }
      if(this.cuisine !== undefined){
          console.log(this.cuisine.length);
          for(let c of this.cuisine){
              this.favorite.cuisine += c +', ';
          }
      }
      this.favorite.source_URL = data.source.sourceRecipeUrl;
     
      if (this.favorite.id !== undefined) {
          this.subscribeToSaveResponse(
              this.favoriteService.update(this.favorite));
      } else {
          this.subscribeToSaveResponse(
              this.favoriteService.create(this.favorite));
      }

  }
  
  private subscribeToSaveResponse(result: Observable<Favorites>) {
      result.subscribe((res: Favorites) =>
          this.onSaveSuccess(res), (res: Response) => this.onSaveError());
  }
  
  private onSaveSuccess(result: Favorites) {
      this.eventManager.broadcast({ name: 'favoritesListModification', content: 'OK'});
      this.isSaving = false;
  }
  
  private onSaveError() {
      this.isSaving = false;
  }
  
}
@Component({
    selector:'ngbd-help-content',
    template:`<div class="modal-header">
        <h4 class="modal-title">Help</h4> 
        <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
            <ngb-tabset>
  <ngb-tab title="Recommendations by Inventory">
    <ng-template ngbTabContent>
      <p>Upon selecting this option, you will be shown various categories of items. 
      These categories contain items that can be used as the main ingredient.</p>
      <p>From there, you can select one of the ingredients you own in your personal Inventory from that category. 
      After this, you will get results based on the chosen ingredient</p>
    </ng-template>
  </ngb-tab>
  <ngb-tab>
    <ng-template ngbTabTitle>Recommendations by Time</ng-template>
    <ng-template ngbTabContent>
      <p>Want a recommendation for something to eat right now? This will provide you recommendations based on the current time.</p>
      <p>For example, if it is midday, you will get recommendations for lunch and brunch, while also excluding results for dinner and other inappropriate courses</p>
    </ng-template>
  </ngb-tab>
   <ngb-tab>
    <ng-template ngbTabTitle>Recommendations by Cuisine</ng-template>
    <ng-template ngbTabContent>
      <p>Have you been favoriting recipes? If so, this might be the ideal tool for you</p>
      <p>This tool will find your favorites and the most commonly occurring cuisine type amongst them. 
      Then, you will get recommendations based on the cuisine you seem to be liking the most</p>
      <p>(Supported Cuisines: Chinese, Indian, Italian, Mexican)
    </ng-template>
  </ngb-tab>
  </ngb-tabset>
      </div>
      <div class="modal-footer">
      </div>`
  })
  export class NgbdHelpContent {
    @Input() name;
    @Input() yield: string;
    @Input() recipe: any;
    @Input() image: string;
    isSaving: boolean;
    recipeIngredients = new Array();
    testVar: Boolean = true;
    favorite: Favorites;
    itemCategory: Boolean = false;
    currentAccount: any;
    largeImageDetails: any[];
    eventSubscriber: Subscription;
    currentSearch: string;
    choices = new Array();
    recipes: any[];
    recipeFound: boolean = false;
    recipeDetailsFound: boolean = false;
    
    constructor(public activeModal: NgbActiveModal,
            private eventManager: JhiEventManager,
            private favoriteService: FavoritesService) {}
    

    
    save(data) {
        this.isSaving = true;
        this.favorite = new Favorites();
        this.isSaving = true;
        this.favorite.ingredients = "";
        this.favorite.recipe_title = data.name;
        this.favorite.cuisine = "";
        for(let ingredient of data.ingredientLines){
            this.favorite.ingredients += ''+ingredient;
        }
        this.favorite.source_URL = data.source.sourceRecipeUrl;
        
        if (this.favorite.id !== undefined) {
            this.subscribeToSaveResponse(
                this.favoriteService.update(this.favorite));
        } else {
            this.subscribeToSaveResponse(
                this.favoriteService.create(this.favorite));
        }

    }
    
    private subscribeToSaveResponse(result: Observable<Favorites>) {
        result.subscribe((res: Favorites) =>
            this.onSaveSuccess(res), (res: Response) => this.onSaveError());
    }
    
    private onSaveSuccess(result: Favorites) {
        this.eventManager.broadcast({ name: 'favoritesListModification', content: 'OK'});
        this.isSaving = false;
    }
    
    private onSaveError() {
        this.isSaving = false;
    }
    
  }

@Component({
    selector: 'jhi-recommend',
    templateUrl: './recommend.component.html'
})
export class RecommendComponent implements OnInit, OnDestroy {
    @Input()
    public alerts: Array<IAlert> = [];

    private backup: Array<IAlert>;
    userInventory = new Array();
    userFavorites = new Array();
    categories = new Array();
    images: Array<string>;
    ingredientNames = new Array();
    //Important categories
    itemCategory: Boolean = false;
    listItemCategories: Boolean = false;
    fruitInventory = new Array();
    vegInventory = new Array();
    meatInventory = new Array();
    grainInventory = new Array();
    //Query 
    isSaving: boolean;
    largeImage: any;
    ingredients = new Array();
    recipeParam: string = "";
    recipeIngredients = new Array();
    beginVar: Boolean = true;
    shoppingList: Shopping_List;
    currentAccount: any;
    favoriteVariable: any;
    largeImageDetails: any[];
    eventSubscriber: Subscription;
    currentSearch: string;
    choices = new Array();
    recipes: any[];
    recipeFound: boolean = false;
    recipeDetailsFound: boolean = false;

    constructor(
        private RecommendService: RecommendService,
        private inventoryService: InventoryService,
        private jhiAlertService: JhiAlertService,
        private shoppingListService: Shopping_ListService,
        private eventManager: JhiEventManager,
        private activatedRoute: ActivatedRoute,
        private _recipeListService: RecipeListService,
        private principal: Principal,
        private modalService: NgbModal,
        config: NgbCarouselConfig,
        private _http: HttpClient,
        private favoriteService: FavoritesService
    ) { }

    loadAll() {
        this.userInventory = this.userInventory;
        return this.userInventory; 
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
        this.inventoryService.query().subscribe(
                (res: ResponseWrapper) => {
                    this.userInventory = res.json;
                    console.log(this.userInventory);
                    this.findInventoryCategoryAndName(this.userInventory);
                },
                (res: ResponseWrapper) => this.onError(res.json)
            );
        this.favoriteService.query().subscribe(
                (res: ResponseWrapper) => {
                    this.userFavorites = res.json;
                    console.log(this.userFavorites);
                  //  this.findInventoryCategoryAndName(this.userFavorites);
                },
                (res: ResponseWrapper) => this.onError(res.json)
            );
        this.principal.identity().then((account) => {
            this.currentAccount = account;
        });
      
        this.registerChangeInRecommends();

    }
    
    isAuthenticated() {
        return this.principal.isAuthenticated();
    }
    
    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    trackId(index: number, item: Recommend) {
        return item.id;
    }
    
    findInventoryCategoryAndName(inventories){
        for(let inventory of inventories){
           if(inventory.category != null){
           if(inventory.category.id === 2)
               this.fruitInventory.push(inventory);
           if(inventory.category.id === 1)
               this.meatInventory.push(inventory); 
           if(inventory.category.id === 3)
               this.vegInventory.push(inventory);
           if(inventory.category.id === 4)
               this.grainInventory.push(inventory);
           }
           if(inventory.ingredient_name != null )
           this.ingredientNames.push(inventory.ingredient_name.toLowerCase());
           
        }
        console.log( this.ingredientNames );
        console.log( this.meatInventory);
        console.log( this.fruitInventory );
    }
    
    beginRecommendations(){
        this.choices = new Array();
        this.favoriteVariable = "";
        this.beginVar = false;
        this.itemCategory = true;
        this.listItemCategories = false;
    }
    
    listCategories(){
        this.favoriteVariable = "";
        this.itemCategory = false;
        this.listItemCategories = true;
    }
    
    listIngredients(query: string){
            this.choices=new Array();
            switch(query){
            case 'meat':
                this.choices=new Array();
                 for(let meat of this.meatInventory){                     
                    
                     this.choices.push(meat);
                 }
                 break;
            case 'fruit':
                this.choices=new Array();
                for(let fruit of this.fruitInventory){
                   
                    this.choices.push(fruit);
                }
                break;
            case 'vegetable':
                this.choices=new Array();
                for(let veg of this.vegInventory){
                   
                    this.choices.push(veg);
                }
                break;
            case 'grain':
                this.choices=new Array();
                for(let grain of this.grainInventory){
                    
                    this.choices.push(grain);
                }
                break;
            }
    }
    
    mainChoice(query: string){
        this.beginRecommendations();
        this.ingredients = new Array();
        this.favoriteVariable = "<h4>Great! Showing you results for " +query;
        this.recipeParam = "";
        this.ingredients.push(query.toLowerCase());
        for(let ingredient of this.ingredients){
            this.recipeParam += '&allowedIngredient=' + ingredient;
        }
        this.choices = new Array();
        return this._recipeListService.getRecipe(this.recipeParam).subscribe(
                data => this.handleSuccess(data),
                error => this.handleError(error),
                () => console.log("Request Complete!"))
    }
    
    registerChangeInRecommends() {
        this.eventSubscriber = this.eventManager.subscribe('recommendListModification', (response) => this.loadAll());
    }

    private onError(error) {
        this.jhiAlertService.error(error.message, null, null);
    }
  
    handleSuccess(data){
        this.recipeFound = true;
        this.recipes = data.matches;
        for(let recipe of this.recipes){
            this.getImg(recipe);
            var ingredientsOnHand = new Array();
            var ingredientsNotOnHand = new Array();
            for(let recipeIngredient of recipe.ingredients){
                if(this.ingredientNames.indexOf(recipeIngredient) == -1){
                    ingredientsNotOnHand.push(recipeIngredient);
                }
                else
                    ingredientsOnHand.push(recipeIngredient);
            }
            recipe.ingredients_owned = ingredientsOnHand;
            recipe.ingredients_not_owned = ingredientsNotOnHand;
            this.testBoogaloo(recipe);
        }
        console.log(this.recipes);
    }
    
    getImg(query: any){
        this._recipeListService.getDetails(query.id).subscribe(
                data => this.handleImage(data, query),
                error => this.handleError(error))
                return this.largeImageDetails;  
    }
    
    handleImage(data: any, query:any){   
        for(let i of data.images){
            this.largeImage = i.hostedLargeUrl;
        }   
        query.largeImage = this.largeImage;
    }
    
    
    timelyRecipe(){
        this.favoriteVariable = "";

        this.recipeParam = "";
        var currentTime = new Date();
        console.log(currentTime.getHours());
        var timeInHours = currentTime.getHours();
        if(timeInHours >=6 && timeInHours<=10){
            this.favoriteVariable = "<h4>Morning! Showing Recommendations for Breakfast</h4>"
            console.log('Breakfast');
            this.recipeParam += '&allowedCourse[]=course^course-Breakfast and Brunch'+
            '&excludedCourse[]=course^course-Main Dishes';

        }
        if(timeInHours > 10 && timeInHours <=15){
            console.log('Brunch');
            this.favoriteVariable = "<h4>Showing Recommendations for Breakfast and Brunch</h4>"
            this.recipeParam += '&allowedCourse[]=course^course-Breakfast and Brunch'
                +'&allowedCourse[]=course^course-Salads'
                +'&allowedCourse[]=course^course-Soups'
                +'&excludedCourse[]=course^course-Main Dishes';
        }
        if(timeInHours >= 12 && timeInHours <=14){
            console.log('Lunch');
            this.favoriteVariable = "<h4>Make your lunch-time better with these recommendations! Showing Recommendations for Lunch</h4>"
            this.recipeParam += '&allowedCourse[]=course^course-Lunch'
                +'&excludedCourse[]=course^course-Main Dishes'
                +'&excludedCourse[]=course^course-Breakfast and Brunch';
        }
        if(timeInHours >= 15 && timeInHours <18){
            console.log('Tea');
            this.favoriteVariable = "<h4>Good evening! Showing Recommendations for Teatime</h4>"
            this.recipeParam += '&allowedCourse[]=course^course-Appetizers'
                +'&allowedCourse[]=course^course-Salads'
                +'&allowedCourse[]=course^course-Soups'
                +'&excludedCourse[]=course^course-Lunch'
                +'&excludedCourse[]=course^course-Breakfast and Brunch';
            
        }
        if(timeInHours >= 18 && timeInHours <=21){
            this.favoriteVariable = "<h4>Showing Recommendations for Dinner</h4>"
            console.log('Dinner');
           this.recipeParam += '&allowedCourse[]=course^course-Main Dishes'
            +'&allowedCourse[]=course^course-Appetizers'
            +'&excludedCourse[]=course^course-Lunch'
            +'&excludedCourse[]=course^course-Breakfast and Brunch'
            
        }
        if(timeInHours >=21 || timeInHours <6){
            this.favoriteVariable = "<h4>Showing Recommendations for Late-Night Dinner and Dessert</h4>"
           this.recipeParam += '&allowedCourse[]=course^course-Main Dishes'
            +'&allowedCourse[]=course^course-Desserts'
            +'&excludedCourse[]=course^course-Lunch'
            +'&excludedCourse[]=course^course-Breakfast and Brunch'
        }
        return this._recipeListService.getRecipe(this.recipeParam).subscribe(
                data => this.handleSuccess(data),
                error => this.handleError(error),
                () => console.log("Request Complete!"))
    }
    
    testBoogaloo(query){
        for(let q of query){
            this.recipeIngredients.push(q.ingredients);
        }
        console.log(this.recipeIngredients);
    } 
    
    //Logs any errors to console
    handleError(error){
        console.log(error);
    }
    
    searchDetail(query: string, attributes:any){
        return this._recipeListService.getDetails(query).subscribe(
                data => this.handleDetails(data, attributes),
                error => this.handleError(error),
                () => console.log("Request Complete!"))
    }
    
    handleDetails(data, attributes){
        this.open(data, attributes)
    }
    
    open(query: any, recipe:any) {
        console.log(recipe.attributes.cuisine);
        const modalRef = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.recipeDetailsFound = true;
        this.largeImageDetails = query.images;
        var largeImage: any;
        console.log(query);
        for(let i of this.largeImageDetails){
            console.log(i.hostedLargeUrl)
            largeImage = i.hostedLargeUrl;
        }
        modalRef.componentInstance.recipe = query;
        modalRef.componentInstance.cuisine = recipe.attributes.cuisine;
        modalRef.componentInstance.ingredients = recipe.ingredients;
        modalRef.componentInstance.image = largeImage;  
      }
    
    favoriteRecommendations(){
        var chineseFavorite=0;
        var indianFavorite =0;
        var italianFavorite=0; 
        var mexicanFavorite=0;
        this.recipeParam = "";
        this.favoriteVariable = "";
        console.log(this.userFavorites);
        for(let userFavorite of this.userFavorites){
            console.log(userFavorite.cuisine)
            if(typeof userFavorite.cuisine !== "undefined" && userFavorite.cuisine != null){
                if(userFavorite.cuisine.toLowerCase().indexOf("mexican") != -1){
                    mexicanFavorite++;
                }
                if(userFavorite.cuisine.toLowerCase().indexOf("italian") != -1){
                    italianFavorite++;
                }
                if(userFavorite.cuisine.toLowerCase().indexOf("indian") != -1){
                    indianFavorite++;
                }
                
                if(userFavorite.cuisine.toLowerCase().indexOf("chinese") != -1){
                    chineseFavorite++;
                }
            }
        }

        if(chineseFavorite > mexicanFavorite && chineseFavorite > italianFavorite && chineseFavorite > indianFavorite){
            this.favoriteVariable = "<h4>You seem to be favouriting a lot of Chinese recipes! Here are some more for you.<div></div>" +
            		"(FoodPal highly recommends the Char Siu pork!)</h4>"
            this.recipeParam += "&allowedCuisine[]=cuisine^cuisine-chinese";
        }
        else if(mexicanFavorite > chineseFavorite && mexicanFavorite > italianFavorite && mexicanFavorite > indianFavorite)
        {    
            this.favoriteVariable = "<h4>You seem to be favouriting a lot of Mexican recipes. Let's give you some more Mexican recommendations!</h4>"
            this.recipeParam += "&allowedCuisine[]=cuisine^cuisine-mexican";
        }
        else if(italianFavorite > chineseFavorite && italianFavorite > mexicanFavorite && italianFavorite > indianFavorite)
        {  
            this.favoriteVariable = "<h4>Ah, Italy! A country of romance, fine art and, of course, fine food! Let's give you some more Italian recommendations!</h4>"
            this.recipeParam += "&allowedCuisine[]=cuisine^cuisine-italian";
        }
        else if(indianFavorite > chineseFavorite && indianFavorite > mexicanFavorite && indianFavorite > italianFavorite)
        {  
            this.favoriteVariable = "<h4>You seem to be favouriting a lot of Indian recipes. Let's give you some more Indian recommendations!</h4>"
            this.recipeParam += "&allowedCuisine[]=cuisine^cuisine-indian";
        }
        else{
            this.favoriteVariable = "<h4>You seem to be favoriting everything equally! Here are some more general recommendations</h4>"
                
        }

            
        console.log(this.recipeParam) 
        console.log(mexicanFavorite, italianFavorite, indianFavorite);
        if(mexicanFavorite == 0 && chineseFavorite == 0 && indianFavorite == 0 && italianFavorite == 0)
            this.favoriteVariable = "<h4>We couldn't find any supported cuisines in your favourites.<div></div>" +
            		"Here are some other popular FoodPal recommendations!</h4>";
        return this._recipeListService.getRecipe(this.recipeParam).subscribe(
                data => this.handleSuccess(data),
                error => this.handleError(error),
                () => console.log("Request Complete!"))
    }
    
    help() {
        const modalRef = this.modalService.open(NgbdHelpContent, { size : 'lg' });
      }
    
    save(data) {
        if(data.ingredients_not_owned.length > 0){
            this.isSaving = true;
            var today = new Date();
            this.shoppingList = new Shopping_List();
            this.shoppingList.items = "";
            for(let ingredient of data.ingredients_not_owned){
                if(ingredient != 'undefined')
                    this.shoppingList.items += ingredient.toString() + ', ';
            }
            this.shoppingList.notes = "Created on: " + today + ' from the following recipe: ' + data.recipeName;
            if (this.shoppingList.id !== undefined) {
                this.subscribeToSaveResponse(
                    this.shoppingListService.update(this.shoppingList));
            } else {
                this.subscribeToSaveResponse(
                    this.shoppingListService.create(this.shoppingList));
                this.alerts.push({
                    id: 1,
                    type: 'success',
                    message: 'Missing ingredients for ' + data.recipeName+' have been added to a new shopping list'});
            }
        }
        else{
            this.alerts.push({
                id: 1,
                type: 'danger',
                message: 'You are not missing any ingredients for ' + data.recipeName});
    }
        
       
          
    }
    
    public closeAlert(alert: IAlert) {
        const index: number = this.alerts.indexOf(alert);
        this.alerts.splice(index, 1);
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
    
    

}

