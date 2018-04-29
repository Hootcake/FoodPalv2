import { Component, OnInit, Input } from '@angular/core';
import { NgbModalRef, NgbModal, NgbActiveModal, NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';
import { JhiEventManager } from 'ng-jhipster';
import { Account, LoginModalService, Principal, RecipeListService } from '../shared';
import { Observable } from "rxjs/Observable";
import { FavoritesService } from "../entities/favorites/favorites.service";
import { Favorites } from '../entities/favorites/favorites.model';
import { Subscription } from "rxjs/Subscription";

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
      <td *jhiHasAnyAuthority="'ROLE_USER'"><button class="btn btn-md btn-outline-primary" (click)="save(recipe)">Save to Favourites</button></td>
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
    selector: 'jhi-home',
    templateUrl: './home.component.html',
    styleUrls: [
        'home.css'
    ],
    providers: [NgbDropdownConfig]

})
export class HomeComponent implements OnInit {
    largeImage: any;
    account: Account;
    modalRef: NgbModalRef;
    recipes: any[];
    diets = new Array();
    recipeIngredients = new Array();
    ingredientNames = new Array();

    searchQuery: string = null;
    ingredients = new Array();
    recipeParam: string = "";
    public details;
    largeImageDetails: any[];
    model = {
            left: false,
            middle: false,
            right: false
          };
    recipeFound: boolean = false;
    recipeDetailsFound: boolean = false;
    dietChecked: boolean = false;
    constructor(
        private principal: Principal,
        private loginModalService: LoginModalService,
        private eventManager: JhiEventManager,
        private _recipeListService: RecipeListService,
        private modalService: NgbModal,
        config: NgbDropdownConfig
        ) {
        config.autoClose = false;
    }

    ngOnInit() {
        this.principal.identity().then((account) => {
            this.account = account;
        });
        this.registerAuthenticationSuccess();
    }

    registerAuthenticationSuccess() {
        this.eventManager.subscribe('authenticationSuccess', (message) => {
            this.principal.identity().then((account) => {
                this.account = account;
            });
        });
    }

    isAuthenticated() {
        return this.principal.isAuthenticated();
    }

    testFunc(e) {
        if(e.target.checked){
            this.dietChecked = true;
            this.searchRecipes(null, '388^Lacto vegetarian');
        }
        if(this.dietChecked == true && !e.target.checked){
            this.diets.splice(this.diets.indexOf('388^Lacto vegetarian'), 1);
            this.refreshSearch();
        }
    }
   
    login() {
        this.modalRef = this.loginModalService.open();
    }
    
    testBoogaloo(query){
        for(let q of query){
            this.recipeIngredients.push(q.ingredients);
        }
        console.log(this.recipeIngredients);
    } 
   
    handleSuccess(data){
        this.recipeFound = true;
        this.recipes = data.matches;
        for(let recipe of this.recipes){
            this.getImg(recipe);
            if(this.account != null){
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
        }
        console.log(this.recipes);
    }
    
    handleDetails(data, attributes){
        this.open(data, attributes)
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
    
    //Logs any errors to console
    handleError(error){
        console.log(error);
    }
    
    
    // Pings our second API: Giving us the details of a recipe based on the UID given to us from our primary API
    searchDetail(query: string, attributes:any){
        return this._recipeListService.getDetails(query).subscribe(
                data => this.handleDetails(data, attributes),
                error => this.handleError(error),
                () => console.log("Request Complete!"))
    }
    
    deleteIngredient(ingredient: string, diet: string){
        console.log(this.ingredients.indexOf(ingredient));
        this.ingredients.splice(this.ingredients.indexOf(ingredient), 1);
        this.refreshSearch();
    }
    
    // Refresh our search every time an ingredient is removed from the ingredients array
    refreshSearch(){
        console.log(this.dietChecked);
        this.recipeParam = "";
        for(let ingredient of this.ingredients){
            this.recipeParam += '&allowedIngredient=' + ingredient;
        }
        for(let diet of this.diets){
            this.recipeParam += '&allowedDiet[]=' + diet;
        }
        return this._recipeListService.getRecipe(this.recipeParam).subscribe(
                data => this.handleSuccess(data),
                error => this.handleError(error),
                () => console.log("Request Complete!"))
    }
    
    // Search recipes, called every time a new ingredient is added
    searchRecipes(query: string, diet: string){
        console.log(this.dietChecked);
        this.recipeParam = "";
        if(query != null)
            this.ingredients.push(query.toLowerCase());
        if(diet != null)
            this.diets.push(diet);
        console.log(this.ingredients);
        for(let ingredient of this.ingredients){
            this.recipeParam += '&allowedIngredient=' + ingredient;
        }
        for(let diet of this.diets){
            this.recipeParam += '&allowedDiet[]=' + diet;
        }
        this.searchQuery = ''
        return this._recipeListService.getRecipe(this.recipeParam).subscribe(
                data => this.handleSuccess(data),
                error => this.handleError(error),
                () => console.log("Request Complete!"))
    }
    
    // Opens up our modal dialog 'ngbd-modal-dialog'. Receives JSON-P object through query. 
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
}
