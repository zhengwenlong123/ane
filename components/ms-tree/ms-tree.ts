import * as avalon from 'avalon2';
import '../ms-checkbox';
import './metroStyle.css';
import * as $ from 'jquery';
import './jquery.ztree.core';
import './jquery.ztree.excheck';

avalon.component('ms-tree', {
    template: require('./ms-tree.html'),
    defaults: {
        checkable: false,
        halfCheckable:false,
        chkboxType:{"Y": "ps", "N": "ps"},
        tree: [],
        expandedKeys: [],
        checkedKeys: [],
        selectedKeys: [],
        currentTarget:'',
        onCheck: avalon.noop,
        onSelect: avalon.noop,
        beforeExpand: avalon.noop,
        beforeCollapse: avalon.noop,
        onDblClick: avalon.noop,
        handleCheck(e, treeId, node) {
            const treeObj = $.fn.zTree.getZTreeObj(treeId);
            const checkedNodes = treeObj.getNodesByFilter(n => {
                const parentNode = n.getParentNode();
                const checkStatus = n.getCheckStatus() || { checked: false, half: false };
                const parentCheckStatus = parentNode ? (parentNode.getCheckStatus() || { checked: false, half: false }) : { checked: false, half: false };
                return (checkStatus.checked && !checkStatus.half) && (!parentCheckStatus.checked || parentCheckStatus.half);
            });
            const checkedKeys = checkedNodes.map(n => n.key);
            //this.checkedKeys = checkedKeys
            if(this.currentTarget == node.key){
                this.onCheck(checkedKeys, {
                    checked: node.checked,
                    checkedNodes: checkedNodes,
                    node: node,
                    event: e
                });
            }
        },
        handleSelect(e, treeId, node, clickFlag) {
            this.selectedKeys = [node.key];
            this.onSelect(this.selectedKeys.toJSON(), {
                selected: clickFlag,
                selectedNodes: [{
                    key: node.key, title: node.title
                }],
                node: node,
                event: e
            });
        },
        handleDblClick(e, treeId, node) {
            if (!node)
                return;
            this.selectedKeys = [node.key];
            this.onDblClick(this.selectedKeys.toJSON(), {
                selectedNodes: [{
                    key: node.key, title: node.title
                }],
                node: node,
                event: e
            });
        },
        cancelHalf(e,treeId,treeNode){//半勾选清除功能
            var zTree = $.fn.zTree.getZTreeObj(treeId);
            treeNode.halfCheck = false;
            zTree.updateNode(treeNode);
            this.handleCheck(e, treeId, treeNode);
        },
        onInit(event) {
            var initTree = (el, tree) => {
                return $.fn.zTree.init($(el), {
                    check: { 
                        enable: this.checkable,
                        autoCheckTrigger: this.halfCheckable,
                        chkboxType: this.chkboxType
                    },
                    data: {
                        key: {
                            name: 'title'
                        }
                    },
                    callback: {
                        onCheck: (e, treeId, node) => {
                            if(this.halfCheckable && node.halfCheck){
                                this.cancelHalf(e,treeId,node);
                            }else{
                                this.handleCheck(e, treeId, node);
                            }
                        },
                        onClick: (e, treeId, node, clickFlag) => {
                            this.handleSelect(e, treeId, node, clickFlag);
                        },
                        beforeExpand: (treeId, treeNode) => {
                            this.beforeExpand(treeId, treeNode);
                            return (treeNode.expand !== false);
                        },
                        beforeCollapse: (treeId, treeNode) => {
                            this.beforeCollapse(treeId, treeNode);
                        },
                        beforeCheck: (treeId, treeNode) => {
                            this.currentTarget = treeNode.key;
                        },
                        onDblClick: (e, treeId, node) => {
                            this.handleDblClick(e, treeId, node);
                        }
                    },
                    view: {
                        dblClickExpand: false,
                        fontCss: (treeId, treeNode) => {
                            return (!!treeNode.highlight) ? { color: "#A60000", "font-weight": "bold" } : { color: "#333", "font-weight": "normal" };
                        }
                    }
                }, tree);
            };
            var treeObj = initTree(event.target, this.tree.toJSON());

            this.$watch('checkedKeys', v => {
                if (this.checkable) {
                    treeObj.checkAllNodes(false);
                    treeObj.getNodesByFilter(n => v.contains(n.key)).forEach(n => {
                        treeObj.checkNode(n, true, true);
                    });
                } else {
                    treeObj.getNodesByFilter(n => v.contains(n.key)).forEach(n => {
                        treeObj.selectNode(n);
                    });
                }
            });

            this.$watch('expandedKeys', v => {
                treeObj.expandAll(false);
                treeObj.getNodesByFilter(n => v.contains(n.key)).forEach(n => {
                    treeObj.expandNode(n, true);
                });
            });

            this.$watch('tree', v => {
                treeObj = initTree(event.target, v.toJSON());
            });

            this.$fire('checkedKeys', this.checkedKeys);
            this.$fire('expandedKeys', this.expandedKeys);
        }
    }
});