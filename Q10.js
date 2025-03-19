const margin = { top: 50, right: 50, bottom: 50, left: 60 },
      width = 450 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

const tooltip = d3.select("#tooltip");

d3.csv("data_ggsheet.csv").then(rawData => {
    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

    rawData.forEach(d => {
        d["Thời gian tạo đơn"] = parseDate(d["Thời gian tạo đơn"]);
        d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1;
        d["Mã đơn hàng"] = d["Mã đơn hàng"].trim();
        d["Nhóm gộp"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
        d["Mặt hàng gộp"] = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
    });

    const groupByMonthGroupItem = d3.rollups(
        rawData,
        v => ({
            count: new Set(v.map(d => d["Mã đơn hàng"])).size
        }),
        d => d["Tháng"],
        d => d["Nhóm gộp"],
        d => d["Mặt hàng gộp"]
    );

    const groupByMonthGroup = d3.rollups(
        rawData,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Tháng"],
        d => d["Nhóm gộp"]
    );

    const totalOrdersByGroupMonthObj = {};
    groupByMonthGroup.forEach(([month, groups]) => {
        groups.forEach(([group, count]) => {
            totalOrdersByGroupMonthObj[`${month}-${group}`] = count;
        });
    });

    const data = [];
    groupByMonthGroupItem.forEach(([month, groups]) => {
        groups.forEach(([groupName, items]) => {
            const totalInGroupMonth = totalOrdersByGroupMonthObj[`${month}-${groupName}`] || 1;
            items.forEach(([itemName, itemData]) => {
                data.push({
                    month: +month,
                    group: groupName,
                    item: itemName,
                    count: itemData.count,
                    probability: itemData.count / totalInGroupMonth
                });
            });
        });
    });

    const dataGroup = d3.groups(data, d => d.group);

    dataGroup.forEach(([groupName, groupData]) => {
        const chartDiv = d3.select("#charts")
            .append("div")
            .attr("class", "chart");

        chartDiv.append("div")
            .attr("class", "chart-title")
            .text(groupName);

        const svg = chartDiv.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(groupData, d => d.month))
            .range([0, width]);

        const minY = d3.min(groupData, d => d.probability);
        const maxY = d3.max(groupData, d => d.probability);
        const y = d3.scaleLinear()
            .domain([Math.max(0, minY - 0.1), Math.min(1, maxY + 0.1)])
            .range([height, 0]);

        const color = d3.scaleOrdinal(d3.schemeTableau10);
        const itemsGroup = d3.groups(groupData, d => d.item);
        const line = d3.line()
            .x(d => x(d.month))
            .y(d => y(d.probability));

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(12).tickFormat(d => `T${String(d).padStart(2, '0')}`));

        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

        itemsGroup.forEach(([itemName, itemData]) => {
            svg.append("path")
                .datum(itemData)
                .attr("fill", "none")
                .attr("stroke", color(itemName))
                .attr("stroke-width", 2)
                .attr("d", line);

            svg.selectAll(".dot")
                .data(itemData)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.month))
                .attr("cy", d => y(d.probability))
                .attr("r", 5)
                .attr("fill", color(itemName))
                .on("mouseover", (event, d) => {
                    const itemsInChart = data.filter(item => item.group === d.group && item.month === d.month);
                    itemsInChart.sort((a, b) => a.item.localeCompare(b.item));

                    let tooltipContent = `<strong>T${String(d.month).padStart(2, '0')}</strong><br>`;
                    itemsInChart.forEach(item => {
                        const itemCode = item.item.match(/\[SET\d+\]/)?.[0] || "";
                        const itemName = item.item.replace(itemCode, "").trim();
                        tooltipContent += `${itemCode} ${itemName} <strong>${(item.probability * 100).toFixed(1)}%</strong><br>`;
                    });

                    tooltip.style("opacity", 1)
                        .html(tooltipContent)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px")
                        .style("white-space", "nowrap");
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                });
        });
    });
}).catch(error => {
    console.error("Lỗi load dữ liệu:", error);
});
