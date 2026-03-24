<template>
	<div class="table-wrap">
		<table class="data-table">
			<thead>
				<tr>
					<th
						v-for="col in columns"
						:key="col.key"
						:style="{ width: col.width || 'auto' }"
						:class="col.align === 'right' ? 'align-right' : col.align === 'center' ? 'align-center' : ''"
					>
						{{ col.label }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="rows.length === 0">
					<td :colspan="columns.length" class="empty-cell">{{ emptyText }}</td>
				</tr>
				<tr v-for="(row, index) in rows" :key="resolveKey(row, index)">
					<td
						v-for="col in columns"
						:key="col.key"
						:class="col.align === 'right' ? 'align-right' : col.align === 'center' ? 'align-center' : ''"
					>
						<slot :name="`cell-${col.key}`" :row="row" :column="col" :value="row[col.key]">
							{{ formatValue(row[col.key]) }}
						</slot>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script setup>
const props = defineProps({
	columns: {
		type: Array,
		default: () => [],
	},
	rows: {
		type: Array,
		default: () => [],
	},
	rowKey: {
		type: String,
		default: 'id',
	},
	emptyText: {
		type: String,
		default: 'No data.',
	},
});

const resolveKey = (row, index) => row?.[props.rowKey] || row?.id || row?.recordId || row?.invoiceId || index;

const formatValue = (value) => {
	if (value === null || value === undefined || value === '') return '-';
	return value;
};
</script>

<style scoped>
.table-wrap {
	width: 100%;
	overflow-x: auto;
}

.data-table {
	width: 100%;
	border-collapse: collapse;
	min-width: 720px;
}

.data-table th,
.data-table td {
	border-bottom: 1px solid #e5e7eb;
	padding: 12px 10px;
	text-align: left;
	vertical-align: top;
}

.data-table th {
	font-size: 13px;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	color: #475569;
	background: #f8fafc;
}

.data-table td {
	color: #1f2937;
}

.align-right {
	text-align: right;
}

.align-center {
	text-align: center;
}

.empty-cell {
	text-align: center;
	color: #64748b;
	padding: 20px 10px;
}
</style>
