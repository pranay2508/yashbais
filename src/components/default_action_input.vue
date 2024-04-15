<script setup>
/* eslint-disable */
import { defineProps, inject } from 'vue';
import { Collapse, Table } from 'ant-design-vue';

const config = inject('app_config');
const controller = inject('controller');
const vueClientEmitter = inject('emitter');

const props = defineProps({
    id: String,
    actionInput: Object,
    workflowName: String,
});

</script>

<template>
    <a-collapse class="collapse">
        <a-collapse-panel :header="`${actionInput['workflowName']} - ${actionInput['description']}`" key="1">
            <div :id="id">
                <a-table class="compact-table" 
                    :columns="Object.keys(actionInput).filter(key => !['actionInputsIndex', 'description'].includes(key)).map(key => ({ title: key, dataIndex: key }))"
                    :dataSource="[actionInput]" :pagination="false" :size="medium"
                    :showHeader="true"/>
            </div>
        </a-collapse-panel>
    </a-collapse>
</template>

<style>
.collapse{
    width: fit-content;
    font-size: 12px;
    border-radius: 10px;
}
.compact-table thead tr th{
    font-size: 12px;
    font-weight: bold;
}
</style>