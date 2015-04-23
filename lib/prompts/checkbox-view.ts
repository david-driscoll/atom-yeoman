import spacePen = require("atom-space-pen-views");
import _ = require('lodash');
import $ = require('jquery');
import EventKit = require("event-kit");

class CheckboxView extends spacePen.View {

    public static content() {

        return this.div({}, () => {
            this.p({
                outlet: 'message'
            }, '');

            return this.div({
                "class": 'select-list'
            }, (() => {
                    this.div({
                        "class": 'error-message',
                        outlet: 'errors'
                    });
                    this.div({
                        "class": 'loading',
                        outlet: 'loadingArea'
                    }, () => {
                            this.span({
                                "class": 'loading-message',
                                outlet: 'loading'
                            });
                            return this.span({
                                "class": 'badge',
                                outlet: 'loadingBadge'
                            });
                        });
                    return this.ol({
                        "class": 'list-group',
                        outlet: 'list'
                    });
                }));
        });
    }

    public maxItems = Infinity;
    public scheduleTimeout = null;
    public inputThrottle = 50;
    public cancelling = false;
    private errors: JQuery;
    private list: JQuery;
    private loadingArea: JQuery;
    private loading: JQuery;
    private loadingBadge: JQuery;
    private items: any[];
    private message: JQuery;
    private panel: Atom.Panel;
    private disposable: EventKit.CompositeDisposable;

    constructor(private question: Prompt.List, private invokeNext: (result: any) => void) {
        super();
    }

    /*
    Section: Construction
     */

    public initialize() {
    }


    /*
    Section: Methods that must be overridden
     */

    public viewForItem(item): JQuery {
        return spacePen.$$(function() {
            return this.li({
                "class": 'event checkbox',
                'data-event-name': item.value
            }, () => {
                    this.input({ type: "checkbox", value: "true" });
                    return this.span(item.name, {
                        title: item.name
                    });
                });
        });
    }

    public confirmed(item) {
        this.cancel();

        if (this.invokeNext) {
            this.invokeNext(item.value);
        }

        return null;
    }


    /*
    Section: Managing the list of items
     */

    public setItems(items) {
        this.items = items != null ? items : [];
        this.populateList();
        this.setLoading();
    }

    public getSelectedItem() {
        return this.getSelectedItemView().data('select-list-item');
    }

    public setMaxItems(maxItems) {
        this.maxItems = maxItems;
    }

    public populateList() {
        if (this.items == null) {
            return;
        }
        this.list.empty();
        var j;
        if (this.items.length) {
            this.setError(null);
            for (var i = j = 0, ref1 = Math.min(this.items.length, this.maxItems); 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                var item = this.items[i];
                var itemView = $(this.viewForItem(item));
                itemView.data('select-list-item', item);
                this.list.append(itemView);
            }
            return this.selectItemView(this.list.find('li:first'));
        } else {
            return this.setError(this.getEmptyMessage(this.items.length, this.items.length));
        }
    }


    /*
    Section: Messages to the user
     */

    public setError(message?) {
        if (message == null) {
            message = '';
        }
        if (message.length === 0) {
            return this.errors.text('').hide();
        } else {
            this.setLoading();
            return this.errors.text(message).show();
        }
    }

    public setLoading(message?) {
        if (message == null) {
            message = '';
        }
        if (message.length === 0) {
            this.loading.text("");
            this.loadingBadge.text("");
            return this.loadingArea.hide();
        } else {
            this.setError();
            this.loading.text(message);
            return this.loadingArea.show();
        }
    }

    public getEmptyMessage(itemCount, filteredItemCount) {
        return 'No matches found';
    }


    /*
    Section: View Actions
     */

    public cancel() {
        this.list.empty();
        return clearTimeout(this.scheduleTimeout);
    }

    public toggle() {
        if (this.panel && this.panel.isVisible()) {
            this.cancel();
        } else {
            this.show();
        }
    }

    public show() {
        if (this.panel == null) {
            this.panel = atom.workspace.addModalPanel({ item: this });
        }
        this.disposable = new EventKit.CompositeDisposable();
        this.panel.show();
        this.message.text(this.question.message);

        // infer the generator somehow? based on the project information?  store in the project system??
        this.setItems(this.question.choices);

        if (this.question.default) {
            _.each(this.question.default, (def) => {

                var selected = this.list.find('[data-event-name="' + this.question.default + '"]');
                _.each(selected, (x) => this.selectCheckbox(x));
            });
        }

        $(document).on('keyup.checkbox-view', (e) => {
            if (e.which === 32) {
                this.selectCheckbox(this.getSelectedItemView());
                e.preventDefault();
            }
        })

        //core:confirm

        this.disposable.add(atom.commands.add(document.body, 'core:move-up', (event) => {
            this.selectPreviousItemView();
            return event.stopPropagation();
        }));

        this.disposable.add(atom.commands.add(document.body, 'core:move-down', (event) => {
            this.selectNextItemView();
            return event.stopPropagation();
        }));

        this.disposable.add(atom.commands.add(document.body, 'core:move-to-top', (event) => {
            this.selectItemView(this.list.find('li:first'));
            this.list.scrollToTop();
            return event.stopPropagation();
        }));

        this.disposable.add(atom.commands.add(document.body, 'core:move-to-bottom', (event) => {
            this.selectItemView(this.list.find('li:last'));
            this.list.scrollToBottom();
            return event.stopPropagation();
        }));

        this.list.on('mousedown', (arg) => {
            var target = arg.target;
            if (target === this.list[0]) {
                return false;
            }
        });

        this.list.on('mousedown', 'li', (e) => {
            this.selectItemView($(e.target).closest('li'));
            e.preventDefault();
            return false;
        });

        /*return this.list.on('mouseup', 'li', (e) => {
            if ($(e.target).closest('li').hasClass('selected')) {
                this.confirmSelection();
            }
            e.preventDefault();
            return false;
        });*/
    }

    public hide() {
        this.disposable.dispose();
        this.panel && this.panel.hide();
        this.panel.destroy();
        this.panel = null;
        $(document).off('keyup.checkbox-view')
    }


    /*
    Section: public
     */

    public selectPreviousItemView() {
        var view = this.getSelectedItemView().prev();
        if (!view.length) {
            view = this.list.find('li:last');
        }
        return this.selectItemView(view);
    }

    public selectNextItemView() {
        var view = this.getSelectedItemView().next();
        if (!view.length) {
            view = this.list.find('li:first');
        }
        return this.selectItemView(view);
    }

    public selectItemView(view) {
        if (!view.length) {
            return;
        }
        this.list.find('.selected').removeClass('selected');
        // checkbox
        view.addClass('selected');
        return this.scrollToItemView(view);
    }

    public selectCheckbox(view) {
        if (!view.length) {
            return;
        }

        var input = <HTMLInputElement>view.find('input')[0];
        input.checked = !input.checked;
    }

    public scrollToItemView(view) {
        var scrollTop = this.list.scrollTop();
        var desiredTop = view.position().top + scrollTop;
        var desiredBottom = desiredTop + view.outerHeight();
        if (desiredTop < scrollTop) {
            return this.list.scrollTop(desiredTop);
        } else if (desiredBottom > this.list.scrollBottom()) {
            return this.list.scrollBottom(desiredBottom);
        }
    }

    public getSelectedItemView() {
        return this.list.find('li.selected');
    }

    public confirmSelection() {
        var item;
        item = this.getSelectedItem();
        if (item != null) {
            return this.confirmed(item);
        } else {
            return this.cancel();
        }
    }

    public schedulePopulateList() {
        var populateCallback;
        clearTimeout(this.scheduleTimeout);
        populateCallback = () => {
            if (this.isOnDom()) {
                return this.populateList();
            }
        };
        return this.scheduleTimeout = setTimeout(populateCallback, this.inputThrottle);
    }
}

export = CheckboxView;
