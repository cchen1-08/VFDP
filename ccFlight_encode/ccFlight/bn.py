from rpy2.robjects.packages import importr, data
from rpy2.robjects import r, IntVector, StrVector, DataFrame, FactorVector, Formula, Environment, reval
import rpy2.robjects as robjects
from collections import defaultdict
rsymbol = robjects.rinterface.SexpSymbol


bnlearn = importr("bnlearn")
as_data_frame = r('as.data.frame')
as_array = r('as.array')
as_matrix = r('as.matrix')
rclass = r('class')
rnames = r('names')
gs = r('gs')
bn_fit = r('bn.fit')
model2network = r('model2network')
cpquery = r('cpquery')


def tupls2RDataframe(data, titles):
    cols = [[]for _ in titles]
    for datum in data:
        for i, e in enumerate(datum):
            cols[i].append(e)
    col_d = {}
    for i, t in enumerate(titles):
        col_d[t] = StrVector(tuple(cols[i]))
        col_d[t] = FactorVector(col_d[t])
    dataf = DataFrame(col_d)
    return dataf


def displayFitted(fitted):
    for node_data in fitted:
        node = str(node_data[0][0])
        parents = list(node_data[1])
        children = list(node_data[2])
        prob = node_data[3]
        prob = as_data_frame(prob)
        print('node: {}\nparents: {}\nchildren: {}\n prob: {}'.format(
            node, parents, children, prob))


def getProbFactors(fitted, events, evidence):
    env = Environment()
    env['fitted'] = fitted

    str_cpquery = "cpquery(fitted,({}),({}))"
    suppVals = [reval(str_cpquery.format(event, evidence), envir=env)[0]
                for event in events]

    return suppVals


def fitModel(dataset, model, nodes):
    net = model2network(model)
    dfData = tupls2RDataframe(dataset, nodes)
    fitted = bn_fit(net, dfData)
    return fitted
